import requests
import datetime
from fastapi import FastAPI, Response
import uvicorn
from apscheduler.schedulers.background import BackgroundScheduler



# Sensor configuration
name = "{{ SENSOR_INFORMATION_NAME }}"
port = {{ SENSOR_INFORMATION_PORT}}


# API Gateway information
endpoint_information = {
    "endpoint_url": "{{ SENSOR_APIGATEWAY_URL}}",
    "endpoint_port": {{ SENSOR_APIGATEWAY_PORT }},
    "endpoint": "http://{{ SENSOR_APIGATEWAY_URL}}:{{ SENSOR_APIGATEWAY_PORT }}"
}
# Cron task configuration
cron_info = {
    "day_of_the_week": "{{ SENSOR_CRONJOB_DAY_OF_WEEK }}",
    "hour": "{{ SENSOR_CRONJOB_HOUR }}",
    "minute": "{{ SENSOR_CRONJOB_MINUTE }}"
}
MONDAY, SUNDAY = 0, 6
MIN_HOUR, MAX_HOUR, MIN_MINUTE, MAX_MINUTE = 0, 23, 0, 59

data_endpoint_url = "{{ SENSOR_INFORMATION_ENDPOINT }}"
HTTP_OK = 200

app = FastAPI()
scheduler = BackgroundScheduler()

def log(message: str):
    print(f"[{datetime.datetime.now()}]: {message}.")

def clear_data(input_json_data: dict):
    return input_json_data

def sense_data():
    log("Sensing the data")
    response = requests.get(data_endpoint_url)
    if response.status_code == HTTP_OK:
        return clear_data(response.json())
    else:
        raise ValueError(f"The Status code is different from {HTTP_OK}, something went wrong.")

def send_data_to_endpoint():
    try:
        log("Prepare to send the send the data to the API gateway")
        data = sense_data()
        requests.post(url=endpoint_information["endpoint"], json=data)
        log("Data sent to the API gateway")
    except (ValueError, requests.exceptions.JSONDecodeError) as error:
        log(f"An error occurred -> {repr(error)}")

def config_scheduler():
    log(f"Configuring the scheduler with the following infomrations: Day: {cron_info["day_of_the_week"]}, Hour: {cron_info["hour"]}, Minute: {cron_info["minute"]}")
    if scheduler.running:
        scheduler.shutdown()
    scheduler.add_job(send_data_to_endpoint, "cron",
                day_of_week=cron_info["day_of_the_week"],
                hour=cron_info["hour"],
                minute=cron_info["minute"],
                timezone="UTC"
            )
    log(f"New Cron task configured")
    scheduler.start()
    

@app.put("/sensor/update/{new_name}")
def update_sensor_name(new_name: str = name):
    log("Received a request to update the Sensor's name")
    name = new_name

@app.put("/sensor/configuration/days")
def update_sensor_date(from_day: int = MONDAY, to_date: int = SUNDAY):
    if MONDAY <= from_day <= to_date and to_date <= SUNDAY:
        log("Received a request to update the Sensor's days of work")
        config_scheduler()

@app.put("/sensor/configuration/time")
def update_sensor_time(hour: int = MIN_HOUR, minute: int = MIN_MINUTE):
    if MIN_HOUR <= hour <= MAX_HOUR and MIN_MINUTE <= minute <= MAX_MINUTE:
        log("Received a new request to update the Sensor's time of work")
        config_scheduler()
@app.get("/health")
def health():
    log("Server pinged")
    return Response(content="Everything is OK")

if __name__ == "__main__":
    config_scheduler()
    uvicorn.run(app, host="0.0.0.0", port=port)