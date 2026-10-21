#include <Adafruit_AHTX0.h>
#include <Arduino.h>
#include <ArduinoJson.h>
#include <BH1750.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <Wire.h>

const char *ssid = "hehehe";
const char *password = "12345678";
const char *mqtt_server = "broker.hivemq.com";
const char *mqtt_client_id = "ESP32_thh_Client";
const char *mqtt_user = "hoangth";
const char *mqtt_pass = "b23dcat115";

// ===== 3 TOPIC MQTT =====
const char *topic_sensor = "Sensor/thh";
const char *topic_control = "Device_control/thh";
const char *topic_respond = "Device_respond/thh";

// ===== CẤU HÌNH CHÂN GPIO =====
#define SDA_PIN 8
#define SCL_PIN 9

#define LED_1 0  // nđ
#define LED_2 1  // đa
#define LED_3 20 // as

bool led1_auto = true;
bool led2_auto = true;
bool led3_auto = true;

BH1750 lightMeter;
Adafruit_AHTX0 aht;

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastRead = 0;

void publishDeviceRespond() {
  if (client.connected()) {
    JsonDocument doc;
    doc["LED1"] = (digitalRead(LED_1) == HIGH) ? "ON" : "OFF";
    doc["LED2"] = (digitalRead(LED_2) == HIGH) ? "ON" : "OFF";
    doc["LED3"] = (digitalRead(LED_3) == HIGH) ? "ON" : "OFF";

    char buffer[128];
    serializeJson(doc, buffer, sizeof(buffer));
    client.publish(topic_respond, buffer, true);
  }
}

// ===== NHẬN LỆNH ĐIỀU KHIỂN (Device_control) =====
void callback(char *topic, byte *payload, unsigned int length) {
  if (strcmp(topic, topic_control) != 0)
    return;

  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, payload, length);
  if (err) {
    Serial.printf("[MQTT] JSON parse failed: %s\n", err.c_str());
    return;
  }

  bool changed = false;

  // Điều khiển LED 1
  if (doc["LED1"].is<const char *>()) {
    const char *val = doc["LED1"];
    if (val != nullptr) {
      if (strcmp(val, "AUTO") == 0) {
        led1_auto = true;
      } else {
        led1_auto = false;
        digitalWrite(LED_1, strcmp(val, "ON") == 0 ? HIGH : LOW);
      }
      changed = true;
    }
  }

  // Điều khiển LED 2
  if (doc["LED2"].is<const char *>()) {
    const char *val = doc["LED2"];
    if (val != nullptr) {
      if (strcmp(val, "AUTO") == 0) {
        led2_auto = true;
      } else {
        led2_auto = false;
        digitalWrite(LED_2, strcmp(val, "ON") == 0 ? HIGH : LOW);
      }
      changed = true;
    }
  }

  // Điều khiển LED 3
  if (doc["LED3"].is<const char *>()) {
    const char *val = doc["LED3"];
    if (val != nullptr) {
      if (strcmp(val, "AUTO") == 0) {
        led3_auto = true;
      } else {
        led3_auto = false;
        digitalWrite(LED_3, strcmp(val, "ON") == 0 ? HIGH : LOW);
      }
      changed = true;
    }
  }

  if (changed) {
    publishDeviceRespond();
  }
}

// ===== ĐIỀU KHIỂN TỰ ĐỘNG THEO CẢM BIẾN (MODE AUTO) =====
void checkAndControlSensors(float temp, float humid, float lux) {
  bool changed = false;

  // LED 1 (Nhiệt độ > 35.5*C)
  if (led1_auto && !isnan(temp)) {
    bool curState = (digitalRead(LED_1) == HIGH);
    bool newState = curState;
    if (temp > 35.5)
      newState = true;
    else if (temp < 34.5)
      newState = false;

    if (newState != curState) {
      digitalWrite(LED_1, newState ? HIGH : LOW);
      changed = true;
    }
  }

  // LED 2 (Độ ẩm > 31.0%)
  if (led2_auto && !isnan(humid)) {
    bool curState = (digitalRead(LED_2) == HIGH);
    bool newState = curState;
    if (humid > 31.0)
      newState = true;
    else if (humid < 29.0)
      newState = false;

    if (newState != curState) {
      digitalWrite(LED_2, newState ? HIGH : LOW);
      changed = true;
    }
  }

  // LED 3 (Ánh sáng < 95 lx)
  if (led3_auto && !isnan(lux) && lux >= 0) {
    bool curState = (digitalRead(LED_3) == HIGH);
    bool newState = curState;
    if (lux < 95.0)
      newState = true;
    else if (lux > 105.0)
      newState = false;

    if (newState != curState) {
      digitalWrite(LED_3, newState ? HIGH : LOW);
      changed = true;
    }
  }

  if (changed) {
    publishDeviceRespond();
  }
}

// ===== KẾT NỐI LẠI MQTT =====
void reconnect() {
  while (!client.connected()) {
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[WiFi] Lost connection, reconnecting...");
      WiFi.reconnect();
      unsigned long start = millis();
      while (WiFi.status() != WL_CONNECTED && millis() - start < 10000) {
        delay(500);
        Serial.print(".");
      }
      if (WiFi.status() != WL_CONNECTED) {
        Serial.println(" [WiFi] Reconnect failed, retry later.");
        return;
      }
      Serial.println("\n[WiFi] Reconnected! IP: " + WiFi.localIP().toString());
    }

    Serial.printf("Connecting to MQTT (Client: %s)...", mqtt_client_id);
    bool connected = (strlen(mqtt_user) > 0)
                         ? client.connect(mqtt_client_id, mqtt_user, mqtt_pass)
                         : client.connect(mqtt_client_id);
    if (connected) {
      Serial.println(" Connected!");
      client.subscribe(topic_control);
      publishDeviceRespond();
    } else {
      Serial.print(" Failed, rc=");
      Serial.print(client.state());
      Serial.println(" Retry in 5s...");
      delay(5000);
      break; // Tránh treo vô tận nếu server bảo trì, cho phép loop() tiếp tục
    }
  }
}

// ===== SETUP =====
void setup() {
  Serial.begin(115200);

  pinMode(LED_1, OUTPUT);
  pinMode(LED_2, OUTPUT);
  pinMode(LED_3, OUTPUT);

  digitalWrite(LED_1, LOW);
  digitalWrite(LED_2, LOW);
  digitalWrite(LED_3, LOW);

  Wire.begin(SDA_PIN, SCL_PIN);

  if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
    Serial.println("BH1750 initialized successfully!");
  } else {
    Serial.println("Warning: BH1750 not found. Check SDA/SCL wiring!");
  }

  if (aht.begin(&Wire)) {
    Serial.println("AHT10/AHT20 initialized successfully!");
  } else {
    Serial.println("Warning: AHT sensor not found. Check SDA/SCL wiring!");
  }

  WiFi.mode(WIFI_STA);
  WiFi.setTxPower(WIFI_POWER_8_5dBm);

  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected! IP: ");
  Serial.println(WiFi.localIP());

  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

// ===== LOOP =====
void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  if (millis() - lastRead >= 3000) {
    lastRead = millis();

    sensors_event_t humidity, temp;
    bool ahtOk = aht.getEvent(&humidity, &temp);
    if (!ahtOk) {
      aht.begin(&Wire); // Thử khởi tạo lại nếu trước đó bị lỏng dây
      ahtOk = aht.getEvent(&humidity, &temp);
    }

    float tempC = ahtOk ? temp.temperature : NAN;
    float humid = ahtOk ? humidity.relative_humidity : NAN;
    float lux = lightMeter.readLightLevel();

    if (!isnan(tempC) && !isnan(humid) && !isnan(lux) && lux >= 0 && lux < 50000) {
      Serial.printf("[Sensor] Temp: %.1f *C | Hum: %.1f %% | Lux: %.1f lx\n",
                    tempC, humid, lux);

      // Gửi dữ liệu lên topic Sensor
      JsonDocument doc;
      doc["temperature"] = round(tempC * 10.0) / 10.0;
      doc["humidity"] = round(humid * 10.0) / 10.0;
      doc["light"] = round(lux * 10.0) / 10.0;

      char sensorBuffer[128];
      serializeJson(doc, sensorBuffer, sizeof(sensorBuffer));
      client.publish(topic_sensor, sensorBuffer);

      // Kiểm tra và điều khiển LED tự động theo cảm biến
      checkAndControlSensors(tempC, humid, lux);
    } else {
      Serial.printf("[Sensor] Loi doc du lieu cam bien! Kiem tra day noi I2C "
                    "(SDA=%d, SCL=%d)\n",
                    SDA_PIN, SCL_PIN);
    }
  }
}
