const fs = require('fs').promises
const camelcase = require('camelcase')
const { promisify } = require('util')
const rimraf = promisify(require('rimraf'))
const svgr = require('@svgr/core').default
const babel = require('@babel/core')
const { dirname } = require('path')

let transform = async (svg, componentName) => {
  let component = await svgr(
    svg,
    {
      jsxRuntime: 'automatic',
    },
    { componentName }
  )

  component = component.replace(
    'import * as React from "react"',
    'import Nullstack from "nullstack"'
  )

  let { code } = await babel.transformAsync(component, {
    plugins: [
      [
        require('@babel/plugin-transform-react-jsx'),
        {
          useBuiltIns: true,
          runtime: 'classic',
          pragma: 'Nullstack.element',
          pragmaFrag: 'Nullstack.fragment',
        },
      ],
    ],
  })

  return code
}

async function getIcons(style) {
  let files = await fs.readdir(`./optimized/${style}`)
  return Promise.all(
    files.map(async (file) => ({
      svg: await fs.readFile(`./optimized/${style}/${file}`, 'utf8'),
      componentName: `${camelcase(file.replace(/\.svg$/, ''), {
        pascalCase: true,
      })}Icon`,
    }))
  )
}

function exportAll(icons, includeExtension = true) {
  return icons
    .map(({ componentName }) => {
      let extension = includeExtension ? '.njs' : ''
      return `export { default as ${componentName} } from './${componentName}${extension}'`
    })
    .join('\n')
}

async function ensureWrite(file, text) {
  await fs.mkdir(dirname(file), { recursive: true })
  await fs.writeFile(file, text, 'utf8')
}

async function ensureWriteJson(file, json) {
  await ensureWrite(file, JSON.stringify(json, null, 2))
}

async function buildIcons(style) {
  let outDir = `./nullstack/${style}`
  let icons = await getIcons(style)

  await Promise.all(
    icons.flatMap(async ({ componentName, svg }) => {
      let content = await transform(svg, componentName)
      let types = `import type { NullstackFunctionalComponent, SVGProps, NullstackNode } from 'nullstack';\ndeclare const ${componentName}: NullstackFunctionalComponent<SVGProps<NullstackNode>>;`

      return [
        ensureWrite(`${outDir}/${componentName}.njs`, content),
        ...(types ? [ensureWrite(`${outDir}/${componentName}.d.ts`, types)] : []),
      ]
    })
  )

  await ensureWrite(`${outDir}/index.js`, exportAll(icons))
  await ensureWrite(`${outDir}/index.d.ts`, exportAll(icons, false))
}

/**
 * @param {string[]} styles
 */
async function buildExports(styles) {
  let pkg = {}

  // For those that want to read the version from package.json
  pkg[`./package.json`] = { default: './package.json' }

  // Explicit exports for each style:
  for (let style of styles) {
    pkg[`./${style}`] = {
      types: `./${style}/index.d.ts`,
      default: `./${style}/index.js`,
    }
    pkg[`./${style}/*`] = {
      types: `./${style}/*.d.ts`,
      default: `./${style}/*.njs`,
    }
    pkg[`./${style}/*.njs`] = {
      types: `./${style}/*.d.ts`,
      default: `./${style}/*.njs`,
    }
  }

  return pkg
}

async function main() {
  const esmPackageJson = { type: 'module', sideEffects: false }

  console.log(`Building Nullstack package...`)

  await Promise.all([
    rimraf(`./nullstack/20/solid/*`),
    rimraf(`./nullstack/24/outline/*`),
    rimraf(`./nullstack/24/solid/*`),
  ])

  await Promise.all([
    buildIcons('20/solid'),
    buildIcons('24/outline'),
    buildIcons('24/solid'),
    ensureWriteJson(`./nullstack/20/solid/package.json`, esmPackageJson),
    ensureWriteJson(`./nullstack/24/outline/package.json`, esmPackageJson),
    ensureWriteJson(`./nullstack/24/solid/package.json`, esmPackageJson),
  ])

  let packageJson = JSON.parse(await fs.readFile(`./nullstack/package.json`, 'utf8'))

  packageJson.exports = await buildExports(['20/solid', '24/outline', '24/solid'])

  await ensureWriteJson(`./nullstack/package.json`, packageJson)

  return console.log(`Finished building Nullstack package.`)
}

main()