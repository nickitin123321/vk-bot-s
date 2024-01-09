import { VK } from 'vk-io';
import 'dotenv/config'
import TelegramBot from 'node-telegram-bot-api'
const { env: { VK_TOKEN, VK_IDS, T_TOKEN, T_CHAT_ID } } = process

const vk = new VK({
    token: VK_TOKEN
});
const POLLING_SETTINGS = {
  interval: 300,
  autoStart: true
}
const bot = new TelegramBot(T_TOKEN, {polling: POLLING_SETTINGS});
const onlined = new Map();
let chatId = null
let stopSpy = false

bot.onText(/\/start/, async (msg) => {
  const { chat: { id, first_name, username } } = msg
  chatId = id
  stopSpy = false
  onlined.clear()

  id !== 683594347 && bot.sendMessage(683594347, JSON.stringify({first_name, username, id}))
  bot.sendMessage(id, 'Вы подписались на рассылку')
})

bot.onText(/\/stop/, () => {
  chatId = null
  stopSpy = true
  onlined.clear()

  bot.sendMessage(id, 'Вы отписались')
})

setInterval(async () => {
  const chId = chatId || T_CHAT_ID
  if(!chId || stopSpy) return

  for (const vkId of VK_IDS.split(',')){
    try {
      const res = await vk.api.users.get({
        user_ids: vkId,
        fields: 'online'
      })
      const isOnline = res[0].online === 1;
      const msg = isOnline ? 'Онлайн' : 'Оффлайн';
      if (isOnline && !onlined.has(vkId)) {
        bot.sendMessage(chId, `${vkId}: ${msg}`);
        onlined.set(vkId, Date.now())

        setTimeout(() => {
          onlined.clear()
        }, 60 * 30 * 1000)
      }
    } catch (err) {
      console.log(err);
    }
  }
}, 5000);