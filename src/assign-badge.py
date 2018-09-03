#!/usr/bin/python
# Example using a character LCD connected to a Raspberry Pi

import RPi.GPIO as GPIO
import MFRC522
import signal
from subprocess import call
import mysql.connector
import datetime
import time

continue_reading = True

cnx = mysql.connector.connect(user='root', password='password',
                              host='host',
                              database='badgeuse')


# Capture SIGINT for cleanup when the script is aborted
def end_read(signal, frame):
    global continue_reading
    print "Ctrl+C captured, ending read."
    continue_reading = False
    GPIO.cleanup()
    cnx.close()


# Hook the SIGINT
signal.signal(signal.SIGINT, end_read)

# Create an object of the class MFRC522
MIFAREReader = MFRC522.MFRC522()
GPIO.setwarnings(False)
GPIO.setup(33, GPIO.OUT)
GPIO.setup(31, GPIO.OUT)

def print_screen(string):
    call(['/home/pi/MFRC522-python/lcd_write', string])


def lookup(promo):
    result = []
    try:
        cursor = cnx.cursor()
        answer = cursor.callproc('user_whout_badge', [promo])
        for result in cursor.stored_results():
            r = result.fetchall()
    finally:
        cursor.close()
    return r

def insert(uid, id):
    try:
        cursor = cnx.cursor()
        cursor.callproc('add_badge', [id, uid])
    finally:
        cnx.commit()
        cursor.close()

user_list = lookup('RO7YX211')

user = user_list.pop(0)
print_screen(str(user[1]) + ' ' + str(user[2]))
while continue_reading:
    # try:
    
    # Scan for cards
    (status, TagType) = MIFAREReader.MFRC522_Request(MIFAREReader.PICC_REQIDL)

    # Get the UID of the card
    (status, uid) = MIFAREReader.MFRC522_Anticoll()

    # If we have the UID, continue
    if status == MIFAREReader.MI_OK:
        complete_uid = ''
        # Print UID
        for u in uid:
            complete_uid += str(u)
        insert(complete_uid, user[0])
        user = user_list.pop(0)
        print_screen(str(user[1]) + ' ' + str(user[2]))

        
