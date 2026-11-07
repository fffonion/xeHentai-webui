<script>
import util from '@/assets/js/util.js'
import { Line } from 'vue-chartjs'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Legend,
  Tooltip
} from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Legend, Tooltip)

var options = {
  responsive: true,
  animation: false,
  elements: {
    point: {
      radius: 0,
      hitRadius: 4,
      hoverRadius: 4
    }
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      enabled: false
    }
  },
  scales: {
    x: {
      display: false
    },
    y: {
      type: 'linear',
      beginAtZero: true,
      border: {
        display: false
      },
      grid: {
        drawTicks: false,
        color: (context) => (context.tick && context.tick.value === 0
          ? 'rgba(0, 0, 0, 0.1)'
          : 'rgba(0, 0, 0, 0.05)')
      },
      ticks: {
        padding: 10,
        // Values are bytes/s, so a fixed step would explode the tick count;
        // let chart.js space them and cap how many it shows.
        precision: 0,
        autoSkip: true,
        maxTicksLimit: 5,
        callback: function (value) {
          return util.humanSpeed(value, 1)
        }
      }
    }
  }
}

export default {
  components: {
    LineChart: Line
  },
  props: ['data', 'size'],
  computed: {
    chartData: function () {
      return {
        labels: this.chartLabels,
        datasets: [
          {
            label: 'Speed',
            backgroundColor: '#EDEBDF',
            borderColor: '#E3E0D1',
            // chart.js defines push/pop/splice wrappers on the array it
            // receives; handing it Vue's reactive proxy recurses forever, so
            // pass a plain copy.
            data: [...(this.data || [])]
          }
        ]
      }
    },
    chartLabels: function () {
      var labels = []
      for (var i = this.size; i > 0; i--) {
        labels.push(Date.now() - i)
      }
      return labels
    },
    chartOptions: function () {
      return options
    }
  }
}
</script>

<template>
  <line-chart :data="chartData" :options="chartOptions"/>
</template>

<style>
</style>
