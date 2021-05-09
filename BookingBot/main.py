from telegram_bot_calendar import DetailedTelegramCalendar, LSTEP
import telebot
from telebot import types
import datetime
from dotenv import load_dotenv
import os
import requests
import logging
import json

load_dotenv()
TOKEN = os.getenv('TOKEN')
ACCESS_TOKEN = os.getenv('ACCESS_TOKEN')
bot = telebot.TeleBot(TOKEN, parse_mode="MARKDOWN")
# logger = telebot.logger.setLevel(logging.DEBUG)

user_dict = {}
bot_name = "Booking"
start_date = datetime.date(2021, 5, 4)

@bot.message_handler(commands=['start'])
def send_welcome(message):
    user_dict = {}
    chat_id = message.chat.id
    msg = bot.send_message(chat_id, f"Hi there, I am {bot_name} Bot. What's your name?")
    bot.register_next_step_handler(msg, process_name_step)


def process_name_step(message):
    chat_id = message.chat.id
    name = message.text
    user_dict['name'] = name
    data = {
        "userId": chat_id, 
        "username": name, 
    }
    requests.post(url="http://localhost:3306/api/newUser", data=json.dumps(data),  headers={'Content-Type':'application/json',
               'Authorization': 'Bearer {}'.format(ACCESS_TOKEN)})  
    bot.send_message(chat_id, f"Name saved successfully. Thank you {name}. Press /book to start booking a slot.")


@bot.message_handler(commands=['book'])
def start(m):
    user_dict = {}
    chat_id = m.chat.id
    try: 
        calendar, step = DetailedTelegramCalendar(min_date=datetime.date.today()).build()
        bot.send_message(m.chat.id,
                        f"Select {LSTEP[step]}",
                        reply_markup=calendar)
    except KeyError: 
        bot.send_message(chat_id, f"You will need a name to book a slot. Please press /start to input your name.")

@bot.callback_query_handler(func=DetailedTelegramCalendar.func())
def cal(c):
    result, key, step = DetailedTelegramCalendar(min_date=datetime.date.today()).process(c.data)
    if not result and key:
        bot.edit_message_text(f"Select {LSTEP[step]}",
                              c.message.chat.id,
                              c.message.message_id,
                              reply_markup=key)
    elif result:
        isDuplicate = checkDuplicate(c.message.chat.id, result)
        if isDuplicate: 
            bot.edit_message_text(f"Your have already requested for a slot on {result}.",
                                    c.message.chat.id, 
                                    c.message.message_id)
        else:
            user_dict['dateSpecified'] = result
            msg = bot.edit_message_text(f"Please type your reason for returning to office on the {result}.",
                                c.message.chat.id,
                                c.message.message_id)
            bot.register_next_step_handler(msg, process_reason_step)

def process_reason_step(message):
    result = user_dict['dateSpecified']
    chat_id = message.chat.id
    reason = message.text
    isAvailable = checkForSlots(chat_id, user_dict['dateSpecified'])
    if isAvailable: 
            newRequest(chat_id, reason, result)
            bot.send_message(chat_id, f"Your slot has been reserved on the {result}.",
                                message.chat.id)
    else: 
        bot.send_message(chat_id, f"There are no more slots left on {result}, please try again on another day.",
                            message.chat.id)

def checkDuplicate(userId, date):
    data = requests.get(url="http://localhost:3306/api/checkDuplicate", params={"userId": userId, "date": date},  headers={'Content-Type':'application/json',
               'Authorization': 'Bearer {}'.format(ACCESS_TOKEN)})
    if json.loads(data.content)[0]['count(dateApplied)'] == 1: 
        return True 
    else:
        return False
        

def newRequest(userId, reason, result):
    result = str(result)
    data = {
        "userId": userId,
        "reason": reason,
        "dateApplied": result
    } 
    requests.post(url="http://localhost:3306/api/newRequest", data=json.dumps(data),  headers={'Content-Type':'application/json',
               'Authorization': 'Bearer {}'.format(ACCESS_TOKEN)}) 
    
def checkForSlots(userId, date): 
    data = requests.get(url=f"http://localhost:3306/api/availableSlots/{date}",  headers={'Content-Type':'application/json',
               'Authorization': 'Bearer {}'.format(ACCESS_TOKEN)})
    availableSlots = json.loads(data.content)[0]['availableSlots']
    if availableSlots != 0:
        return True 
    return False

@bot.message_handler(commands=['list'])
def list_requests(message):
    chat_id = message.chat.id
    data = requests.get(url=f"http://localhost:3306/api/getMyRequests/{chat_id}",  headers={'Content-Type':'application/json',
               'Authorization': 'Bearer {}'.format(ACCESS_TOKEN)})
    data_obj = json.loads(data.content) 
    requests_list = ""
    if len(data_obj) > 0: 
        for i in data_obj:
            requests_list += f"*Date*: {i['dateApplied']}\n*Status*: {i['status']}\n\n"
        bot.send_message(chat_id, requests_list)
    else: 
        bot.send_message(chat_id, "You do not have any requests.")

bot.polling()

# # while True:
# #     try:
# #         bot.polling(none_stop=True)
# #     except Exception as e:
# #         logger.error(e)
# #         time.sleep(15)

