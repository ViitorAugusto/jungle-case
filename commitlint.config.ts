import { RuleConfigSeverity, type UserConfig } from '@commitlint/types'

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Assuntos em português podem começar com nome próprio ou sigla.
    'subject-case': [RuleConfigSeverity.Disabled],
  },
}

export default config
