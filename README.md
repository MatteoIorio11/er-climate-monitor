Implement the following services:

1. Livelli Idrometrici (Ste)
2. Temperature (Mat)
3. Pressione atmosferica (Fab)
4. Precipitazioni (Mat)
5. Vento (Ste)
6. Umidita relativa (Fab)

API Structure:
1. POST: v0/sensor/detection (save the sensor's detection);
2. GET: v0/sensor/{sensorId}/detections?last={Number} (get the last 5 detections from a sensor, set an upper bound for this value);
3. GET: v0/sensor/positions (get all the different lat/lon along with their ids);
4. GET: v0/sensor/{sensorId}/detections?from={timestamp}&to={timestamp) (get all the detections in a specific interval);
5. GET: v0/service/alerts (get a list of all possible alerts from the current system, this will be used by the notify-service).
