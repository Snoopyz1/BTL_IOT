-- ============================================================
-- SmartHome IoT Database Schema
-- Dựa trên Entity Relationship Diagram
-- ============================================================

CREATE DATABASE IF NOT EXISTS smarthome_iot;
USE smarthome_iot;

-- 1. Bảng User
CREATE TABLE IF NOT EXISTS User (
  user_id INT(10) AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(50),
  email VARCHAR(50) UNIQUE,
  phone VARCHAR(20),
  date_of_birth DATE,
  address VARCHAR(255),
  avatar VARCHAR(255) DEFAULT '',
  role VARCHAR(20) DEFAULT 'User',
  social_links JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Bảng Devices
CREATE TABLE IF NOT EXISTS Devices (
  device_id INT(10) AUTO_INCREMENT PRIMARY KEY,
  device_name VARCHAR(50) NOT NULL,
  device_type VARCHAR(50),
  location VARCHAR(50),
  status BIT DEFAULT 0,
  online BIT DEFAULT 1,
  mqtt_key VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  user_id INT(10),
  FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE SET NULL
);

-- 3. Bảng Sensor
CREATE TABLE IF NOT EXISTS Sensor (
  sensor_id INT(10) AUTO_INCREMENT PRIMARY KEY,
  sensor_type VARCHAR(50),
  sensor_name VARCHAR(50),
  unit VARCHAR(50),
  status BIT DEFAULT 1,
  location VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  device_id INT(10),
  FOREIGN KEY (device_id) REFERENCES Devices(device_id) ON DELETE SET NULL
);

-- 4. Bảng DataSensor
CREATE TABLE IF NOT EXISTS DataSensor (
  data_id INT(10) AUTO_INCREMENT PRIMARY KEY,
  sensor_id INT(10),
  value DECIMAL(10, 2),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sensor_id) REFERENCES Sensor(sensor_id) ON DELETE CASCADE
);

-- 5. Bảng ActionHistory
CREATE TABLE IF NOT EXISTS ActionHistory (
  action_id INT(10) AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(255),
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INT(10),
  device_id INT(10),
  FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE SET NULL,
  FOREIGN KEY (device_id) REFERENCES Devices(device_id) ON DELETE SET NULL
);

-- 6. Bảng Rules (Ngưỡng điều khiển tự động)
CREATE TABLE IF NOT EXISTS Rules (
  threshold_id INT(10) AUTO_INCREMENT PRIMARY KEY,
  threshold_value DECIMAL(10, 2),
  comparison_operator VARCHAR(50),
  action_type VARCHAR(50),
  user_id INT(10),
  device_id INT(10),
  sensor_id INT(10),
  FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE SET NULL,
  FOREIGN KEY (device_id) REFERENCES Devices(device_id) ON DELETE SET NULL,
  FOREIGN KEY (sensor_id) REFERENCES Sensor(sensor_id) ON DELETE SET NULL
);

-- ============================================================
-- Index cho tối ưu truy vấn
-- ============================================================
CREATE INDEX idx_datasensor_sensor_time ON DataSensor(sensor_id, recorded_at);
CREATE INDEX idx_datasensor_recorded_at ON DataSensor(recorded_at);
CREATE INDEX idx_action_device_time ON ActionHistory(device_id, action_time);
CREATE INDEX idx_action_time ON ActionHistory(action_time);
