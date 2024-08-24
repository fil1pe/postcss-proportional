# PostCSS Proportional

![npm version](https://img.shields.io/npm/v/postcss-proportional)
![npm downloads](https://img.shields.io/npm/dm/postcss-proportional)
![license](https://img.shields.io/npm/l/postcss-proportional)
![build status](https://img.shields.io/github/actions/workflow/status/fil1pe/postcss-proportional/build.yml)

This is a PostCSS plugin to make layouts responsively proportional. It allows you to scale the values in px ​​of all properties in your code proportionally based on media queries.

## Installation

### npm

```bash
$ npm install postcss-proportional
```

### yarn

```bash
$ yarn add postcss-proportional
```

## Configuration

PostCSS is a tool for transforming CSS with JavaScript plugins. It allows you to write modern CSS syntax and apply various transformations to your stylesheets. By having PostCSS installed, you can easily integrate the `postcss-proportional` plugin into your build process and leverage its responsive proportional layout capabilities. Make sure to install PostCSS before configuring and using the plugin in your project.

To add the `postcss-proportional` plugin to your PostCSS configuration, you need to update your `postcss.config.json` file. Here's an example of how you can do it:

```json
{
  "plugins": [
    "postcss-proportional"
  ]
}
```

If you don't have a `postcss.config.json` file in your project, you can create one in the root directory and add the above configuration to it.

## Usage

In the example below, the `proportional` feature is applied to the html element. It sets the scale to 0.5 and the rounding to floor when the viewport width is less than or equal to 1400px. When used, the property `proportional: skip;` nullifies the effect of the plugin on the following line.

```css
html {
  font-size: 20px;
  max-width: 1000px;
  proportional: skip;
  margin: 5px;
}

@media (max-width: 1400px) {
  proportional {
    scale: 0.5;
    rounding: floor;
  }
}
```

The following code is generated by PostCSS after processing the above stylesheet:

```css
html {
  font-size: 20px;
  max-width: 1000px;
  margin: 5px;
}

@media (max-width: 1400px) {
  html {
    font-size: 10px;
    max-width: 500px;
  }
}
```

Other properties that can be added to the code are:
- `proportional: keep;` - Keeps the scaled value even if it is the same as the initial one.
- `proportional: rounding-ceil;` - Changes the rounding mode for the next property. Other values ​​can be `rounding-none`, `rounding-floor` and `rounding-round`.
