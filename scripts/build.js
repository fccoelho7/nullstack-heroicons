const fs = require('fs').promises
const camelcase = require('camelcase')
const { promisify } = require('util')
const rimraf = promisify(require('rimraf'))
const { transform } = require('@svgr/core')
const { dirname } = require('path')

async function getIcons(style) {
  const files = await fs.readdir(`./optimized/${style}`)
  return Promise.all(
    files.map(async (file) => ({
      svg: await fs.readFile(`./optimized/${style}/${file}`, 'utf8'),
      componentName: `${camelcase(file.replace(/\.svg$/, ''), {
        pascalCase: true,
      })}Icon`,
    }))
  )
}

function exportAll(icons) {
  return icons
    .map(
      ({ componentName }) => `export { default as ${componentName} } from './${componentName}.jsx'`
    )
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
  const outDir = `./icons/${style}`
  const icons = await getIcons(style)

  await Promise.all(
    icons.flatMap(async ({ componentName, svg }) => {
      const content = await transform(
        svg,
        {
          plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx', '@svgr/plugin-prettier'],
          icon: true,
          jsxRuntime: 'automatic',
        },
        { componentName }
      )

      const types = `import type { NullstackFunctionalComponent, SVGProps, NullstackNode } from 'nullstack';\ndeclare const ${componentName}: NullstackFunctionalComponent<SVGProps<NullstackNode>>;`

      return [
        ensureWrite(`${outDir}/${componentName}.jsx`, content),
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
  const pkg = {}
  const outDir = `./icons`

  // Explicit exports for each style:
  for (const style of styles) {
    pkg[`./${style}`] = {
      types: `${outDir}/${style}/index.d.ts`,
      default: `${outDir}/${style}/index.js`,
    }
    pkg[`./${style}/*`] = {
      types: `${outDir}/${style}/*.d.ts`,
      default: `${outDir}/${style}/*.njs`,
    }
    pkg[`./${style}/*.jsx`] = {
      types: `${outDir}/${style}/*.d.ts`,
      default: `${outDir}/${style}/*.njs`,
    }
  }

  return pkg
}

async function main() {
  await Promise.all([
    rimraf(`./icons/20/solid/*`),
    rimraf(`./icons/24/outline/*`),
    rimraf(`./icons/24/solid/*`),
  ])

  await Promise.all([buildIcons('20/solid'), buildIcons('24/outline'), buildIcons('24/solid')])

  const packageJson = JSON.parse(await fs.readFile(`./package.json`, 'utf8'))

  packageJson.exports = await buildExports(['20/solid', '24/outline', '24/solid'])

  await ensureWriteJson(`./package.json`, packageJson)
}

main()
