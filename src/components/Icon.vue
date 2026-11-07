<template>
  <svg
    version="1.1"
    class="fa-icon"
    :class="klass"
    :role="label ? 'img' : 'presentation'"
    :aria-label="label"
    :width="width"
    :height="height"
    :viewBox="box"
    :style="style">
    <path v-for="(path, i) in paths" :key="`path-${i}`" v-bind="path"/>
    <polygon v-for="(polygon, i) in polygons" :key="`polygon-${i}`" v-bind="polygon"/>
  </svg>
</template>

<script>
import icons from '@/assets/icons/index.js'

export default {
  name: 'FaIcon',
  props: {
    name: {
      type: String,
      validator (val) {
        if (val && !(val in icons)) {
          console.warn(`Invalid prop: unknown icon "${val}".`)
          return false
        }
        return true
      }
    },
    scale: [Number, String],
    spin: Boolean,
    inverse: Boolean,
    flip: {
      validator (val) {
        return val === 'horizontal' || val === 'vertical'
      }
    },
    label: String
  },
  computed: {
    icon () {
      return this.name ? icons[this.name] : null
    },
    normalizedScale () {
      var scale = typeof this.scale === 'undefined' ? 1 : Number(this.scale)
      if (isNaN(scale) || scale <= 0) return 1
      return scale
    },
    // vue-awesome sized glyphs against a 16 unit baseline and set the result
    // as SVG attributes, which is what the header layout expects.
    ratio () {
      if (!this.icon) return 1
      return Math.max(this.icon.width, this.icon.height) / 16
    },
    width () {
      return this.icon ? this.icon.width / this.ratio * this.normalizedScale : 0
    },
    height () {
      return this.icon ? this.icon.height / this.ratio * this.normalizedScale : 0
    },
    box () {
      return this.icon ? `0 0 ${this.icon.width} ${this.icon.height}` : '0 0 0 0'
    },
    paths () {
      return (this.icon && this.icon.paths) || []
    },
    polygons () {
      return (this.icon && this.icon.polygons) || []
    },
    style () {
      if (this.normalizedScale === 1) return undefined
      return { fontSize: this.normalizedScale + 'em' }
    },
    klass () {
      return {
        'fa-spin': this.spin,
        'fa-flip-horizontal': this.flip === 'horizontal',
        'fa-flip-vertical': this.flip === 'vertical',
        'fa-inverse': this.inverse
      }
    }
  }
}
</script>

<style>
.fa-icon {
  display: inline-block;
  fill: currentColor;
}

.fa-flip-horizontal {
  transform: scale(-1, 1);
}

.fa-flip-vertical {
  transform: scale(1, -1);
}

.fa-spin {
  animation: fa-spin 1s 0s infinite linear;
}

.fa-inverse {
  color: #fff;
}

@keyframes fa-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
