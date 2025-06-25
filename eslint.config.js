import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';

export default [
    {
        ignores : [
            '**/node_modules/**',
            'dist/**',
            'build/**',
            'coverage/**',
            '.git/**',
            'public/**',
            'example-json-data/**'
        ]
    },
    // React-specific configuration
    {
        files: ['frontend/**/*.{js,jsx,ts,tsx}'],
        ...pluginReact.configs.flat.recommended,
    },
    {
        files : [
            'frontend/**/*.{js,ts,jsx,tsx}',
            'backend/**/*.{js,ts,jsx,tsx}'
        ],
        rules : {
            'react/jsx-uses-react'     : 'off',
            'react/react-in-jsx-scope' : 'off',
            'accessor-pairs'           : 'off',
            'array-bracket-spacing'    : ['warn', 'never'],
            'array-callback-return'    : 'off',
            'brace-style'              : [
                'warn',
                'stroustrup',
                {
                    allowSingleLine : false
                }
            ],
            'comma-dangle'              : ['error', 'never'],
            'computed-property-spacing' : ['warn', 'never'],
            'dot-notation'              : 'off',
            eqeqeq                      : 'off',
            indent                      : [
                'error',
                4,
                {
                    SwitchCase   : 1,
                    ignoredNodes : ['TemplateLiteral']
                }
            ],
            'key-spacing' : [
                'warn',
                {
                    multiLine : {
                        afterColon  : true,
                        align       : 'colon',
                        beforeColon : true
                    },
                    singleLine : {
                        afterColon  : true,
                        beforeColon : true
                    }
                }
            ],
            'linebreak-style'   : ['error', 'unix'],
            'multiline-ternary' : 'off',
            'new-cap'           : [
                'warn',
                {
                    capIsNew   : false,
                    newIsCap   : false,
                    properties : false
                }
            ],
            'no-duplicate-imports'         : 'error',
            'no-extra-boolean-cast'        : 'off',
            'no-inner-declarations'        : 'off',
            'no-mixed-operators'           : 'off',
            'no-multi-spaces'              : 'off',
            'no-new-func'                  : 'off',
            'no-new-wrappers'              : 'off',
            'no-prototype-builtins'        : 'off',
            'no-restricted-globals'        : ['error', 'event', 'describe'],
            'no-return-assign'             : 'off',
            'no-trailing-spaces'           : 'warn',
            'no-unmodified-loop-condition' : 'off',
            'no-unused-expressions'        : 'off',
            'no-use-before-define'         : 'off',
            'node/no-callback-literal'     : 'off',
            'object-curly-spacing'         : ['warn', 'always'],
            'one-var'                      : 'off',
            'padded-blocks'                : 'off',
            'prefer-const'                 : 'warn',
            'prefer-promise-reject-errors' : 'off',
            'prefer-regex-literals'        : 'off',
            quotes                         : [
                'warn',
                'single',
                {
                    allowTemplateLiterals : true,
                    avoidEscape           : true
                }
            ],
            semi                           : ['error', 'always'],
            'space-before-function-paren'  : ['warn', 'never'],
            'spaced-comment'               : 'off',
            'standard/no-callback-literal' : 'off',
            'template-curly-spacing'       : 'off',
            yoda                           : [
                'error',
                'never',
                {
                    onlyEquality : true
                }
            ],
            'n/no-callback-literal' : 'off',
            'react/prop-types'      : 0
        }
    },
    { languageOptions : { globals : globals.browser } },

    pluginJs.configs.recommended,
    ...tseslint.configs.recommended
];