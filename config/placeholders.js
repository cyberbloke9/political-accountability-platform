const path = require('node:path');

module.exports = {
  // Paths relative to user's project directory
  userDir: {
    // Project specification document
    specifications: path.join('.puttamachine', 'inputs', 'specifications.md'),
    architecture: path.join('.puttamachine', 'artifacts', 'architecture', '*.md'),
    architecture_manifest_json: path.join('.puttamachine', 'artifacts', 'architecture', 'architecture_manifest.json'),
    foundation: path.join('.puttamachine', 'artifacts', 'architecture', '01_Blueprint_Foundation.md'),
    plan: path.join('.puttamachine', 'artifacts', 'plan', '*.md'),
    plan_manifest_json: path.join('.puttamachine', 'artifacts', 'plan', 'plan_manifest.json'),
    plan_fallback: path.join('.puttamachine', 'prompts', 'plan_fallback.md'),
    tasks: path.join('.puttamachine', 'artifacts', 'tasks.json'),
    all_tasks_json: path.join('.puttamachine', 'artifacts', 'tasks', '*.json'),
    task_fallback: path.join('.puttamachine', 'prompts', 'task_fallback.md'),
    context: path.join('.puttamachine', 'prompts', 'context.md'),
    code_fallback: path.join('.puttamachine', 'prompts', 'code_fallback.md'),
    // Add more placeholders as needed:
  },

  // Paths relative to puttamachine package root
  packageDir: {
    orchestration_guide: path.join('prompts', 'orchestration', 'guide.md'),
    arch_output_format: path.join('prompts', 'templates', 'puttamachine', 'output-formats', 'architecture-output.md'),
    plan_output_format: path.join('prompts', 'templates', 'puttamachine', 'output-formats', 'planning-output.md'),
    task_output_format: path.join('prompts', 'templates', 'puttamachine', 'output-formats', 'task-breakdown-output.md'),
    context_output_format: path.join('prompts', 'templates', 'puttamachine', 'output-formats', 'context-output.md'),
    task_validation_output_format: path.join('prompts', 'templates', 'puttamachine', 'output-formats', 'task-validation-output.md'),
    // dev.puttamachine
    smart_anchor: path.join('prompts', 'templates', 'dev-puttamachine', 'sub-agents', 'shared-instructions', 'smart-anchor.md'),
    command_constraints: path.join('prompts', 'templates', 'dev-puttamachine', 'sub-agents', 'shared-instructions', 'command-constraints.md'),
    atomic_generation: path.join('prompts', 'templates', 'dev-puttamachine', 'sub-agents', 'shared-instructions', 'atomic-generation.md'),
    // Add puttamachine package-level placeholders here
  }
};
