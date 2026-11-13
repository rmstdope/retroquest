import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'

/**
 * Selectors for a `.name` (or `.name.toLowerCase()`, or an optional-chained
 * `?.name`) compared with ===, !==, == or != to a string literal, on either side.
 */
function nameComparisonSelectors() {
  const comparison =
    "BinaryExpression:matches([operator='==='], [operator='!=='], [operator='=='], [operator='!='])"
  const name = "MemberExpression[property.name='name']"
  return ['left', 'right'].flatMap((side) => {
    const other = side === 'left' ? 'right' : 'left'
    return [
      `${comparison}[${other}.type=/^(Literal|TemplateLiteral)$/] > ${name}.${side}`,
      `${comparison}[${other}.type=/^(Literal|TemplateLiteral)$/] > ChainExpression.${side}[expression.property.name='name']`,
      `${comparison}[${other}.type=/^(Literal|TemplateLiteral)$/] > CallExpression.${side}[callee.property.name='toLowerCase'] > MemberExpression.callee > ${name}`,
    ]
  })
}

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'js/**', 'css/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    // Unused parameters are kept for overriding methods; name them with a leading _.
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Content tells rooms and characters by instanceof and an item's state by a
    // declared field, never by comparing a display name to a literal.
    files: ['src/act*/**/*.ts', 'src/lantern/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...nameComparisonSelectors().map((selector) => ({
          selector,
          message:
            'Tell a room or character by instanceof and an item state by a declared field; never compare .name to a literal.',
        })),
      ],
    },
  },
  {
    // Only useBridge loads the acts, through dynamic import() calls so each act
    // is its own chunk; nothing else outside the acts imports one.
    files: ['src/**/*.{ts,vue}'],
    ignores: ['src/act*/**', '**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '(^@/act\\d|(^|/)act\\d(/|$))',
              message:
                'Only useBridge loads the acts, with a dynamic import(); never import act code statically.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  prettierConfig,
)
