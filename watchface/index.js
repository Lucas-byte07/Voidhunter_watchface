import { createWidget, deleteWidget, widget, align, prop, text_style, anim_status, events, data_type, show_level } from '@zos/ui'
import { getDeviceInfo } from '@zos/device'
import { Time, Calorie, Battery, Weather, Distance, HeartRate, Sleep } from '@zos/sensor'
import { openApplication } from '@zos/app'

const FONT_PATH = 'fonts/grota_wf.ttf'
const KCAL0_PATH = 'kcal_0/num_'
const KCAL1_PATH = 'kcal_1/num_'
const KCAL2_PATH = 'kcal_2/num_'
const KCAL3_PATH = 'kcal_3/num_'
const MINUTE_PATH = 'minute/num_'
const HOUR_PATH = 'hour/num_'
const SECOND_PATH = 'sec/num_'
const WEEKDAY_PATH = 'week/week_'
const CLIMATE_PATH = 'climate/clima_'
const MINUTEAOD_PATH = 'minuteAOD/num_'
const HOURAOD_PATH = 'hourAOD/num_'
const CLIMATEAOD_PATH = 'climateAOD/clima_'
const NORMAL_ONLY = show_level.ONLY_NORMAL
const AOD_ONLY = show_level.ONLY_AOD

function pad2(n) {
  return n.toString().padStart(2, '0')
}

function pad4(n) {
  return n.toString().padStart(4, '0')
}

function percentToLevel(percent) {
  return Math.max(0, Math.min(10, Math.round(percent / 10)))
}

function getCalorieLevel(current, target) {
  if (!target || target <= 0) return 0
  return percentToLevel((current / target) * 100)
}

function getPercent(current, target) {
  if (!target || target <= 0) return 0
  return Math.max(0, Math.min(100, (current / target) * 100))
}

WatchFace({
  state: {
    animationWidget: null,
    staticBgWidget: null,
    time: null,
    hourNum: null,
    minuteNum: null,
    secondNum: null,
    lastHour: null,
    lastMinute: null,
    updateHourMinuteCallback: null,
    calorie: null,
    calorieNum0: null,
    calorieNum1: null,
    calorieNum2: null,
    calorieNum3: null,
    pts0: null,
    pts1: null,
    pts2: null,
    pts3: null,
    sym1: null,
    sym2: null,
    sym3: null,
    battery: null,
    batteryText: null,
    batteryLabelText: null,
    aodHourNum: null,
    aodMinuteNum: null,
    aodCalorieNum: null,
    aodBatteryNum: null,
    aodWeatherIconWidget: null,
    calorieChangeCallback: null,
    batteryChangeCallback: null,
    shortcutWidgets: null,
    weather: null,
    humidityText: null,
    uviWidget: null,
    weatherIconWidget: null,
    tempText: null,
    tempUnit: null,
    tickIntervalId: null,
    tickCount: 0,
    distance: null,
    distanceText: null,
    dateText: null,
    dayOfWeekIcon: null,
    heartRate: null,
    heartRateChangeCallback: null,
    bpmText: null,          
    updateFrequency: 1
  },

  onInit() {
    console.log('index page.js on init invoke')
  },

  build() {
    console.log('index page.js on build invoke')
    const { width, height } = getDeviceInfo()

    //1) Animation - not added yet for simulator optimization

    //2) Static image
    this.state.staticBgWidget = createWidget(widget.IMG, {
      show_level: NORMAL_ONLY,
      x: 0,
      y: 0,
      w: width,
      h: height,
      src: 'Ramiel_base.png'
    })

    //3) Clock
    const time = new Time()
    this.state.time = time

    const HMS_WIDTH = width
    const HMS_HEIGHT = height
    const HM_X = -40
    const HOUR_Y = 350
    const MINUTE_Y = 400
    const SEC_X = -35
    const SEC_Y = 375

    //3.1) Hour
    this.state.hourNum = createWidget(widget.IMG, {
      show_level: NORMAL_ONLY,
      x: HM_X,
      y: HOUR_Y,
      w: HMS_WIDTH,
      h: HMS_HEIGHT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      src: HOUR_PATH,
      text: pad2(time.getFormatHour()),
    })

    //3.2) Minute
    this.state.minuteNum = createWidget(widget.IMG, {
      show_level: NORMAL_ONLY,
      x: HM_X,
      y: MINUTE_Y,
      w: HMS_WIDTH,
      h: HMS_HEIGHT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      src: MINUTE_PATH,
      text: pad2(time.getMinutes()),
    })
    //3.3) Seconds
    this.state.secondNum = createWidget(widget.IMG, {
      show_level: NORMAL_ONLY,
      x: SEC_X,
      y: SEC_Y,
      w: HMS_WIDTH,
      h: HMS_HEIGHT,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      src: SECOND_PATH,
      text: pad2(time.getSeconds()),
    })
    //3.4) Clock update
    this.state.lastHour = pad2(time.getFormatHour())
    this.state.lastMinute = pad2(time.getMinutes())

    const updateHourMinute = () => {
      const newHour = pad2(this.state.time.getFormatHour())
      if (newHour !== this.state.lastHour) {
        this.state.hourNum.setProperty(prop.NUM, newHour)
        if (this.state.aodHourNum) this.state.aodHourNum.setProperty(prop.NUM, newHour)
        this.state.lastHour = newHour
      }
      const newMinute = pad2(this.state.time.getMinutes())
      if (newMinute !== this.state.lastMinute) {
        this.state.minuteNum.setProperty(prop.NUM, newMinute)
        if (this.state.aodMinuteNum) this.state.aodMinuteNum.setProperty(prop.NUM, newMinute)
        this.state.lastMinute = newMinute
      }
    }

    this.state.updateHourMinuteCallback = updateHourMinute
    time.onPerMinute(updateHourMinute)

    //4) Calories
    const calorie = new Calorie()
    this.state.calorie = calorie

    const calCurrent = calorie.getCurrent()
    const calTarget = calorie.getTarget()
    const calPercent = getPercent(calCurrent, calTarget)

    const KCAL_X = 200
    const KCAL_Y = 150
    const KCAL_W = width
    const KCAL_H = height
    const PTS_X = 250
    const PTS_Y = 170
    const SYM_X = 250
    const SYM_Y = 140
    
    //4.1) 0-32% target calories, visible on both normal and AOD
    this.state.calorieNum0 = createWidget(widget.IMG, {
      x: KCAL_X,
      y: KCAL_Y,
      w: KCAL_W,
      h: KCAL_H,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      src: KCAL0_PATH,
      text: pad4(calCurrent),
    })
    this.state.pts0 = createWidget(widget.IMG, {
      x: PTS_X,
      y: PTS_Y,
      w: width,
      h: height,
      src: 'pts_0.png'
    })
    //4.2) 33-66% target calories
    this.state.calorieNum1 = createWidget(widget.IMG, {
      show_level: NORMAL_ONLY,
      x: KCAL_X,
      y: KCAL_Y,
      w: KCAL_W,
      h: KCAL_H,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      src: KCAL1_PATH,
      text: pad4(calCurrent),
    })
    this.state.pts1 = createWidget(widget.IMG, {
      show_level: NORMAL_ONLY,
      x: PTS_X,
      y: PTS_Y,
      w: width,
      h: height,
      src: 'pts_1.png'
    })
    this.state.sym1 = createWidget(widget.IMG, {
      show_level: NORMAL_ONLY,
      x: SYM_X,
      y: SYM_Y,
      w: width,
      h: height,
      src: 'sym_1.png'
    })
    this.state.calorieNum1.setProperty(prop.VISIBLE, calPercent >= 33)
    this.state.pts1.setProperty(prop.VISIBLE, calPercent >= 33)
    this.state.sym1.setProperty(prop.VISIBLE, calPercent >= 33)

    //4.3) 67-99% target calories
    this.state.calorieNum2 = createWidget(widget.IMG, {
      show_level: NORMAL_ONLY,
      x: KCAL_X,
      y: KCAL_Y,
      w: KCAL_W,
      h: KCAL_H,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      src: KCAL2_PATH,
      text: pad4(calCurrent),
    })
    this.state.pts2 = createWidget(widget.IMG, {
      show_level: NORMAL_ONLY,
      x: PTS_X,
      y: PTS_Y,
      w: width,
      h: height,
      src: 'pts_2.png'
    })
    this.state.sym2 = createWidget(widget.IMG, {
      show_level: NORMAL_ONLY,
      x: SYM_X,
      y: SYM_Y,
      w: width,
      h: height,
      src: 'sym_2.png'
    })
    this.state.calorieNum2.setProperty(prop.VISIBLE, calPercent >= 67)
    this.state.pts2.setProperty(prop.VISIBLE, calPercent >= 67)
    this.state.sym2.setProperty(prop.VISIBLE, calPercent >= 67)

    //4.4) 100%+ target calories
    this.state.calorieNum3 = createWidget(widget.IMG, {
      show_level: NORMAL_ONLY,
      x: KCAL_X,
      y: KCAL_Y,
      w: KCAL_W,
      h: KCAL_H,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      src: KCAL3_PATH,
      text: pad4(calCurrent),
    })
    this.state.pts3 = createWidget(widget.IMG, {
      show_level: NORMAL_ONLY,
      x: PTS_X,
      y: PTS_Y,
      w: width,
      h: height,
      src: 'pts_3.png'
    })
    this.state.sym3 = createWidget(widget.IMG, {
      show_level: NORMAL_ONLY,
      x: SYM_X,
      y: SYM_Y,
      w: width,
      h: height,
      src: 'sym_3.png'
    })
    this.state.calorieNum3.setProperty(prop.VISIBLE, calPercent >= 100)
    this.state.pts3.setProperty(prop.VISIBLE, calPercent >= 100)
    this.state.sym3.setProperty(prop.VISIBLE, calPercent >= 100)

    //5) Battery, visible on both normal and AOD
    const battery = new Battery()
    this.state.battery = battery
    const batCurrent = battery.getCurrent()

    const BATTERY_X = 300
    const BATTERY_Y = 240
    const BATTERY_W = 150
    const BATTERY_H = 30
    const DEFAULT_COLOR = 0xffffff

    this.state.batteryText = createWidget(widget.TEXT_FONT, {
      x: BATTERY_X,
      y: BATTERY_Y,
      w: BATTERY_W,
      h: BATTERY_H,
      color: DEFAULT_COLOR,
      text_size: 22,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.NONE,
      font: FONT_PATH,
      type: data_type.BATTERY,
    })
    this.state.batteryLabelText = createWidget(widget.TEXT_FONT, {
      x: BATTERY_X + 50,
      y: BATTERY_Y,
      w: BATTERY_W,
      h: BATTERY_H,
      color: DEFAULT_COLOR,
      text_size: 22,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.NONE,
      font: FONT_PATH,
      text: '100'
    })
    //6) Weather
     this.state.weather = new Weather()

    const getWeatherData = () => {
      let city = '---', weatherCode = 0, tempMax = '--', tempMin = '--'
      try {
        const forecast = this.state.weather.getForecast()
        if (forecast) {
          if (forecast.cityName) city = forecast.cityName
          if (forecast.forecastData && forecast.forecastData.count > 0) {
            const today = forecast.forecastData.data[0]
            weatherCode = today.index ?? 0
            tempMax = today.high ?? '--'
            tempMin = today.low ?? '--'
          }
        }
      } catch (e) {}
      return { city, weatherCode: parseInt(weatherCode) || 0, tempMax, tempMin }
    }
   
    const initial = getWeatherData()

    //6.1) UVI
    const uviImages = Array.from({ length: 5 }, (_, i) => `uvi/uvi_${i}.png`)
    this.state.uviWidget = createWidget(widget.IMG_LEVEL, {
      show_level: NORMAL_ONLY,
      x: 160,
      y: 240, 
      image_array: uviImages,
      image_length: uviImages.length,
      type: data_type.UVI,
    })

    //6.2) Humidity
    this.state.humidityText = createWidget(widget.TEXT_FONT, {
      show_level: NORMAL_ONLY,
      x: 130,
      y: 220,
      w: 150,
      h: 30,
      color: DEFAULT_COLOR,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.NONE,
      font: FONT_PATH,
      type: data_type.HUMIDITY,
    })

    //6.3) Weather image
    const weatherIconList = Array.from({ length: 29 }, (_, i) => `${CLIMATE_PATH}${i}.png`)
    this.state.weatherIconWidget = createWidget(widget.IMG_LEVEL, {
      show_level: NORMAL_ONLY,
      x: 120, y: 240,
      image_array: weatherIconList,
      image_length: 29,
      type: data_type.WEATHER,
    })

    //6.4) Current temperature
    this.state.tempText = createWidget(widget.TEXT_FONT, {
      show_level: NORMAL_ONLY,
      x: 130,
      y: 300,
      w: 150,
      h: 30,
      color: DEFAULT_COLOR,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      text_style: text_style.NONE,
      font: FONT_PATH,
      type: data_type.WEATHER_CURRENT,
    })
    this.state.tempUnit = createWidget(widget.TEXT, {
      show_level: NORMAL_ONLY,
      x: 195, y: 300,
      w: 20, h: 15,
      color: DEFAULT_COLOR,
      text_size: 20,
      align_h: align.LEFT,
      align_v: align.CENTER_V,
      text: '°',
      })

  },

  onDestroy() {
    console.log('index page.js on destroy invoke')

    // 1) Cancela o listener de tick do relógio (evita callback "zumbi" após destruir a tela)
    if (this.state.time && this.state.updateHourMinuteCallback && typeof this.state.time.offPerMinute === 'function') {
      this.state.time.offPerMinute(this.state.updateHourMinuteCallback)
    }

    // 2) Limpa qualquer intervalo pendente (proteção caso passe a ser usado futuramente)
    if (this.state.tickIntervalId) {
      clearInterval(this.state.tickIntervalId)
      this.state.tickIntervalId = null
    }

    // 3) Remove listeners de sensores registrados via onChange, se existirem
    if (this.state.calorie && this.state.calorieChangeCallback && typeof this.state.calorie.offChange === 'function') {
      this.state.calorie.offChange(this.state.calorieChangeCallback)
    }
    if (this.state.battery && this.state.batteryChangeCallback && typeof this.state.battery.offChange === 'function') {
      this.state.battery.offChange(this.state.batteryChangeCallback)
    }
    if (this.state.heartRate && this.state.heartRateChangeCallback && typeof this.state.heartRate.offChange === 'function') {
      this.state.heartRate.offChange(this.state.heartRateChangeCallback)
    }

    // 4) Libera todos os widgets criados em build() para evitar vazamento de memória
    const widgetsToRelease = [
      this.state.staticBgWidget,
      this.state.hourNum,
      this.state.minuteNum,
      this.state.secondNum,
      this.state.calorieNum0,
      this.state.calorieNum1,
      this.state.calorieNum2,
      this.state.calorieNum3,
      this.state.pts0,
      this.state.pts1,
      this.state.pts2,
      this.state.pts3,
      this.state.sym1,
      this.state.sym2,
      this.state.sym3,
      this.state.batteryText,
      this.state.batteryLabelText,
      this.state.uviWidget,
      this.state.humidityText,
      this.state.weatherIconWidget,
      this.state.tempText,
      this.state.tempUnit,
      this.state.aodHourNum,
      this.state.aodMinuteNum,
      this.state.aodCalorieNum,
      this.state.aodBatteryNum,
      this.state.aodWeatherIconWidget,
    ]

    widgetsToRelease.forEach((w) => {
      if (w) {
        deleteWidget(w)
      }
    })
  },
})
