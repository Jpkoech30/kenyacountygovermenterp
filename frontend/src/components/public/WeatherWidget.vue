<script setup>
/**
 * WeatherWidget — shows current weather for Kapenguria via OpenWeatherMap.
 * Falls back gracefully if API key is missing.
 */
import { ref, onMounted } from 'vue'
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Wind } from '@lucide/vue'

const weather = ref(null)
const forecast = ref([])
const error = ref(false)

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY
const LAT = 1.245
const LON = 35.112

onMounted(async () => {
  if (!API_KEY) {
    error.value = true
    return
  }
  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric`),
    ])
    const currentData = await currentRes.json()
    const forecastData = await forecastRes.json()

    weather.value = {
      temp: Math.round(currentData.main.temp),
      feels_like: Math.round(currentData.main.feels_like),
      condition: currentData.weather[0].main,
      description: currentData.weather[0].description,
      icon: currentData.weather[0].icon,
      humidity: currentData.main.humidity,
      wind_speed: currentData.wind.speed,
    }

    // Get one forecast per day (midday)
    const daily = {}
    forecastData.list.forEach((item) => {
      const date = item.dt_txt.split(' ')[0]
      if (!daily[date] && item.dt_txt.includes('12:00')) {
        daily[date] = {
          date,
          temp: Math.round(item.main.temp),
          condition: item.weather[0].main,
          icon: item.weather[0].icon,
        }
      }
    })
    forecast.value = Object.values(daily).slice(0, 3)
  } catch {
    error.value = true
  }
})

function conditionIcon(condition) {
  const map = {
    Clear: Sun,
    Clouds: Cloud,
    Rain: CloudRain,
    Drizzle: CloudDrizzle,
    Snow: CloudSnow,
    Thunderstorm: CloudLightning,
    Mist: Cloud,
    Haze: Cloud,
  }
  return map[condition] || Cloud
}
</script>

<template>
  <div v-if="!error && weather" class="bg-base-200 rounded-xl p-4 shadow-sm">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-sm font-semibold">Kapenguria</h3>
      <span class="text-xs text-base-content/60">Now</span>
    </div>
    <div class="flex items-center gap-3">
      <component :is="conditionIcon(weather.condition)" class="w-10 h-10 text-primary" />
      <div>
        <span class="text-3xl font-bold">{{ weather.temp }}°C</span>
        <p class="text-xs capitalize text-base-content/70">{{ weather.description }}</p>
      </div>
    </div>
    <div class="flex gap-3 mt-2 text-xs text-base-content/60">
      <span class="flex items-center gap-1"><Wind class="w-3 h-3" /> {{ weather.wind_speed }} m/s</span>
      <span>💧 {{ weather.humidity }}%</span>
    </div>

    <!-- 3-day forecast -->
    <div v-if="forecast.length > 0" class="divider my-2" />
    <div class="flex justify-between">
      <div v-for="day in forecast" :key="day.date" class="text-center">
        <p class="text-xs text-base-content/60">{{ new Date(day.date).toLocaleDateString('en', { weekday: 'short' }) }}</p>
        <component :is="conditionIcon(day.condition)" class="w-5 h-5 mx-auto text-primary" />
        <p class="text-xs font-medium">{{ day.temp }}°</p>
      </div>
    </div>
  </div>

  <!-- Fallback when API key missing or error -->
  <div v-else-if="error" class="bg-base-200 rounded-xl p-4 shadow-sm">
    <h3 class="text-sm font-semibold mb-1">Kapenguria</h3>
    <p class="text-xs text-base-content/60">Weather data unavailable</p>
  </div>
</template>
