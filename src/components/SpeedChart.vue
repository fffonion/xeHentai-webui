<script>
import util from '@/assets/js/util.js'
import { Line } from 'vue-chartjs'

var options = {
  legend: {
    display: false
  },
  animation: {
    duration: 0
  },
  // events: ['click'],
  elements: {
    point: {
      radius: 0,
      hitRadius: 4,
      hoverRadius: 4
    }
  },
  tooltips: {
    enabled: false
  },
  scales: {
    xAxes: [{
      gridLines: {
        display: false,
        drawTicks: false,
        drawBorder: false
      },
      ticks: {
        display: false
      }
    }],
    yAxes: [{
      type: 'linear',
      ticks: {
        padding: 10,
        minStepSize: 10,
        precision: 0,
        autoSkip: true,
        maxTicksLimit: 5,
        beginAtZero: true,
        callback: function (value, index, values) {
          return util.humanSpeed(value, 0)
        }
      },
      gridLines: {
        zeroLineColor: 'rgba(0, 0, 0, 0.1)',
        zeroLineWidth: 1,
        drawBorder: false,
        display: true,
        drawTicks: false
      }
    }]
  }
}
export default {
  extends: Line,
  props: ['data', 'size'],
  computed: {
    chartData: function () {
      return this.data
    },
    chartLabels: function () {
      var labels = []
      for (var i = this.size; i > 0; i--) {
        labels.push(Date.now() - i)
      }
      return labels
    }
  },
  watch: {
    chartData () {
      this.$data._chart.update()
    }
  },
  mounted () {
    this.renderChart({
      labels: this.chartLabels,
      datasets: [
        {
          label: 'Speed',
          backgroundColor: '#EDEBDF',
          borderColor: '#E3E0D1',
          data: this.chartData
        }
      ]
    }, options)
  }
}
</script>

<style>
</style>
