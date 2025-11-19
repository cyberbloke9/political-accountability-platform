import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageUrl, verificationId } = await req.json()

    if (!imageUrl || !verificationId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: imageUrl and verificationId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const googleVisionApiKey = Deno.env.get('GOOGLE_VISION_API_KEY')

    if (!supabaseUrl || !supabaseServiceKey || !googleVisionApiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing required environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { source: { imageUri: imageUrl } },
            features: [
              { type: 'WEB_DETECTION', maxResults: 10 },
              { type: 'SAFE_SEARCH_DETECTION' }
            ]
          }]
        })
      }
    )

    if (!visionResponse.ok) {
      throw new Error(`Google Vision API error: ${visionResponse.statusText}`)
    }

    const visionData = await visionResponse.json()
    const response = visionData.responses[0]

    const hasWebMatches = response.webDetection?.pagesWithMatchingImages?.length > 0
    const safeSearch = response.safeSearchAnnotation
    const isUnsafe = safeSearch?.adult === 'LIKELY' || safeSearch?.adult === 'VERY_LIKELY' ||
                     safeSearch?.violence === 'LIKELY' || safeSearch?.violence === 'VERY_LIKELY'

    const fraudFlags = []
    if (hasWebMatches) fraudFlags.push('reverse_image_match')
    if (isUnsafe) fraudFlags.push('unsafe_content')

    if (fraudFlags.length > 0) {
      const { error: updateError } = await supabase
        .from('verifications')
        .update({ 
          fraud_flags: fraudFlags,
          verification_status: 'disputed'
        })
        .eq('id', verificationId)

      if (updateError) {
        console.error('Failed to update verification:', updateError)
      }
    }

    return new Response(
      JSON.stringify({ 
        fraudDetected: fraudFlags.length > 0,
        flags: fraudFlags,
        details: {
          webMatches: hasWebMatches ? response.webDetection.pagesWithMatchingImages.length : 0,
          safeSearchRatings: safeSearch
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Fraud detection error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
