import { render, screen } from '@testing-library/react'
import { FollowButton, FollowButtonCompact } from '@/components/FollowButton'

// Mock the follows module
jest.mock('@/lib/follows', () => ({
  isFollowing: jest.fn().mockResolvedValue({ following: false }),
  followTarget: jest.fn().mockResolvedValue({ success: true }),
  unfollowTarget: jest.fn().mockResolvedValue({ success: true }),
  getFollowerCount: jest.fn().mockResolvedValue({ count: 10 }),
}))

// Mock useAuth
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 'test-user' },
    loading: false,
  }),
}))

describe('FollowButton Component', () => {
  test('renders follow button with correct text', async () => {
    render(
      <FollowButton
        targetType="politician"
        targetId="123"
        targetName="Test Politician"
      />
    )

    // Wait for loading to complete
    await screen.findByRole('button')
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  test('renders with showCount prop', async () => {
    render(
      <FollowButton
        targetType="politician"
        targetId="123"
        targetName="Test Politician"
        showCount={true}
      />
    )

    await screen.findByRole('button')
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  test('accepts different target types', async () => {
    const { rerender } = render(
      <FollowButton
        targetType="politician"
        targetId="123"
        targetName="Test"
      />
    )
    await screen.findByRole('button')

    rerender(
      <FollowButton
        targetType="promise"
        targetId="456"
        targetName="Test Promise"
      />
    )
    await screen.findByRole('button')
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})

describe('FollowButtonCompact Component', () => {
  test('renders compact version', async () => {
    render(
      <FollowButtonCompact
        targetType="politician"
        targetId="123"
      />
    )

    await screen.findByRole('button')
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
