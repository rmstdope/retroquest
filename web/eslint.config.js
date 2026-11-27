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

/**
 * Selectors for a string or template literal (either branch of a conditional
 * included) passed as the flag name to setStoryFlag or getStoryFlag.
 */
function storyFlagLiteralSelectors() {
  const call = 'CallExpression[callee.property.name=/^(set|get)StoryFlag$/] >'
  const literal = ':matches(Literal, TemplateLiteral)'
  return [
    `${call} ${literal}.arguments:first-child`,
    `${call} ConditionalExpression.arguments:first-child > ${literal}.consequent`,
    `${call} ConditionalExpression.arguments:first-child > ${literal}.alternate`,
  ]
}

/** Whether `node` reads `.name`, optionally chained or lower-cased. */
function isNameRead(node) {
  if (node.type === 'ChainExpression') return isNameRead(node.expression)
  if (node.type === 'MemberExpression') return node.property.name === 'name'
  return isLowerCasing(node) && isNameRead(node.callee.object)
}

/** Whether `node` is a `.toLowerCase()` call. */
function isLowerCasing(node) {
  return (
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    node.callee.property.name === 'toLowerCase'
  )
}

/**
 * Flags a name compared to or searched for a literal by way of a local variable
 * (or searched directly), which the `.name` comparison selectors cannot see.
 */
const noNameAlias = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      alias:
        'Tell a room or character by instanceof and an item state by a declared field; never match its name against a literal.',
    },
  },
  create(context) {
    const unwrapped = (node) => {
      if (node.type === 'ChainExpression') return unwrapped(node.expression)
      return isLowerCasing(node) ? unwrapped(node.callee.object) : node
    }
    /** Whether `node` is a local variable initialised from a `.name` read. */
    const isAlias = (node) => {
      const target = unwrapped(node)
      if (target.type !== 'Identifier') return false
      let scope = context.sourceCode.getScope(target)
      while (scope && !scope.set.has(target.name)) scope = scope.upper
      const def = scope?.set.get(target.name).defs[0]
      return (
        def?.type === 'Variable' &&
        def.node.id === def.name &&
        def.node.init !== null &&
        isNameRead(def.node.init)
      )
    }
    const isText = (node) =>
      node.type === 'TemplateLiteral' ||
      (node.type === 'Literal' && typeof node.value === 'string')
    const report = (node) => context.report({ node, messageId: 'alias' })
    return {
      'BinaryExpression[operator=/^[!=]==?$/]'(node) {
        const { left, right } = node
        if (
          (isText(left) && isAlias(right)) ||
          (isText(right) && isAlias(left))
        )
          report(node)
      },
      'CallExpression[callee.property.name=/^(includes|startsWith|endsWith)$/]'(
        node,
      ) {
        const searched = node.callee.object
        if (isNameRead(unwrapped(searched)) || isAlias(searched)) report(node)
      },
      SwitchStatement(node) {
        const cases = node.cases.some((c) => c.test && isText(c.test))
        if (cases && isAlias(node.discriminant)) report(node)
      },
    }
  },
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
    // declared field, never by comparing a display name to a literal, and names
    // a story flag by its constant.
    files: ['src/act*/**/*.ts', 'src/lantern/**/*.ts'],
    ignores: ['**/*.test.ts'],
    plugins: { content: { rules: { 'no-name-alias': noNameAlias } } },
    rules: {
      'content/no-name-alias': 'error',
      'no-restricted-syntax': [
        'error',
        ...nameComparisonSelectors().map((selector) => ({
          selector,
          message:
            'Tell a room or character by instanceof and an item state by a declared field; never compare .name to a literal.',
        })),
        ...storyFlagLiteralSelectors().map((selector) => ({
          selector,
          message:
            'Name a story flag by its constant in the act StoryFlags file; never type its string.',
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
      globals: { ...globals.browser, __APP_VERSION__: 'readonly' },
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  prettierConfig,
)
