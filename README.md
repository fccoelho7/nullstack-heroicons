<p align="center">
  <a href="https://heroicons.com/#gh-light-mode-only" target="_blank">
    <img src="./.github/logo-light.svg" alt="Heroicons" width="300">
  </a>
  <a href="https://heroicons.com/#gh-dark-mode-only" target="_blank">
    <img src="./.github/logo-dark.svg" alt="Heroicons" width="300">
  </a>
</p>

<p align="center">
  Beautiful hand-crafted SVG icons, by the makers of Tailwind CSS. <br>Available as basic SVG icons and via third-party <a href="https://nullstack.app/" target="_blank">Nullstack</a> library.
<p>

<p align="center">
  <a href="https://heroicons.com"><strong>Browse at Heroicons.com &rarr;</strong></a>
</p>

## Usage

First, install `nullstack-heroicons` from npm:

```sh
npm install nullstack-heroicons
```

Now each icon can be imported individually as a Nullstack component:

```js
import { BeakerIcon } from 'nullstack-heroicons/24/solid'

function MyComponent() {
  return (
    <div>
      <BeakerIcon class="h-6 w-6 text-blue-500" />
      <p>...</p>
    </div>
  )
}
```

The 24x24 outline icons can be imported from `nullstack-heroicons/24/outline`, the 24x24 solid icons can be imported from `nullstack-heroicons/24/solid`, and the 20x20 solid icons can be imported from `nullstack-heroicons/20/solid`.

Icons use an upper camel case naming convention and are always suffixed with the word `Icon`.

## License

This library is MIT licensed.
