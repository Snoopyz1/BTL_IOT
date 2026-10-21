const pool = require('../config/database');

function formatSensor(row) {
  return {
    id: `S${String(row.sensor_id).padStart(3, '0')}`,
    name: row.sensor_name,
    type: row.sensor_type,
    unit: row.unit,
    location: row.location || 'Phòng khách',
    status: row.status && row.status[0] === 1 ? 'ONLINE' : (row.status === 1 ? 'ONLINE' : 'OFFLINE'),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : '',
  };
}

function formatSensorData(row) {
  return {
    id: `SD${String(row.data_id).padStart(5, '0')}`,
    sensorId: `S${String(row.sensor_id).padStart(3, '0')}`,
    sensorName: row.sensor_name,
    sensorType: row.sensor_type,
    value: parseFloat(row.value),
    unit: row.unit,
    recordedAt: row.recorded_at ? new Date(row.recorded_at).toISOString() : '',
  };
}

/** Helper: Parse BIT field from MySQL */
function parseBit(val) {
  if (Buffer.isBuffer(val)) return val[0] === 1;
  if (typeof val === 'number') return val === 1;
  return Boolean(val);
}

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Sensor ORDER BY sensor_id');
    res.json(rows.map((r) => {
      r.status = parseBit(r.status) ? 1 : 0;
      return formatSensor(r);
    }));
  } catch (error) {
    console.error('Get sensors error:', error);
    res.status(500).json({ message: 'Lỗi server!' });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = parseInt(String(req.params.id).replace(/\D/g, ''), 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    const [rows] = await pool.query('SELECT * FROM Sensor WHERE sensor_id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy cảm biến' });
    }
    rows[0].status = parseBit(rows[0].status) ? 1 : 0;
    res.json(formatSensor(rows[0]));
  } catch (error) {
    console.error('Get sensor by ID error:', error);
    res.status(500).json({ message: 'Lỗi server!' });
  }
};

exports.getSensorData = async (req, res) => {
  try {
    const { sensorId, sensorType, time, search, from, to, page = '1', limit = '20' } = req.query;

    const whereConditions = [];
    const params = [];

    if (sensorId) {
      const numericId = parseInt(String(sensorId).replace(/\D/g, ''), 10);
      if (!isNaN(numericId)) {
        whereConditions.push('ds.sensor_id = ?');
        params.push(numericId);
      }
    }

    if (sensorType) {
      whereConditions.push('s.sensor_type = ?');
      params.push(String(sensorType).trim());
    }

    const searchQuery = (search || time || '').trim();
    if (searchQuery) {
      const q = searchQuery;

      // 1. Phép so sánh số: > 30, >= 30.5, < 25, <= 20, = 32
      const compMatch = q.match(/^([><]=?|=)\s*(-?[0-9]+(?:\.[0-9]+)?)$/);
      if (compMatch) {
        const op = compMatch[1];
        const num = parseFloat(compMatch[2]);
        whereConditions.push(`ds.value ${op} ?`);
        params.push(num);
      } else {
        // 2. Khoảng giá trị số: 30 to 35 hoặc 30..35
        const rangeMatch = q.match(/^([0-9]+(?:\.[0-9]+)?)\s*(?:to|\.\.)\s*([0-9]+(?:\.[0-9]+)?)$/);
        if (rangeMatch) {
          const min = parseFloat(rangeMatch[1]);
          const max = parseFloat(rangeMatch[2]);
          whereConditions.push('ds.value BETWEEN ? AND ?');
          params.push(Math.min(min, max), Math.max(min, max));
        } else {
          // 3. Chuỗi thời gian: chứa /, :, hoặc định dạng ngày tháng YYYY-MM-DD
          const isDateOrTime = q.includes('/') || q.includes(':') || /^\d{4}-\d{1,2}/.test(q) || /^\d{1,2}-\d{1,2}/.test(q);
          if (isDateOrTime) {
            const t = q.replace(/\//g, '-');
            whereConditions.push('CAST(ds.recorded_at AS CHAR) LIKE ?');
            params.push(`%${t}%`);
          } else if (/^(19|20)\d{2}$/.test(q)) {
            // Năm 4 chữ số (vd: 2026 từ preset "Năm nay")
            whereConditions.push('(CAST(ds.recorded_at AS CHAR) LIKE ? OR ds.value = ?)');
            params.push(`%${q}%`, parseFloat(q));
          } else {
            // 4. Giá trị cảm biến (hỗ trợ nhập kèm đơn vị: 32.6°C, 68%, 112lux)
            const stripped = q.replace(/\s*(°c|°C|c|C|%|lux|lx)$/i, '').trim();
            const numTarget = stripped || q;
            if (/^-?\d+(\.\d+)?$/.test(numTarget)) {
              const num = parseFloat(numTarget);
              if (numTarget.includes('.')) {
                // Nhập số thập phân (vd: 32.6) -> khớp giá trị hoặc chuỗi
                whereConditions.push('(ds.value = ? OR CAST(ds.value AS CHAR) LIKE ?)');
                params.push(num, `%${numTarget}%`);
              } else {
                // Nhập số nguyên (vd: 32 hoặc 68) -> khớp giá trị hoặc dải số (32.x)
                whereConditions.push('(ds.value = ? OR FLOOR(ds.value) = ? OR CAST(ds.value AS CHAR) LIKE ?)');
                params.push(num, num, `${numTarget}%`);
              }
            } else {
              // 5. Chuỗi tìm kiếm tổng quát
              const t = q.replace(/\//g, '-');
              whereConditions.push('(CAST(ds.recorded_at AS CHAR) LIKE ? OR CAST(ds.value AS CHAR) LIKE ?)');
              params.push(`%${t}%`, `%${q}%`);
            }
          }
        }
      }
    }

    if (from) {
      whereConditions.push('ds.recorded_at >= ?');
      params.push(String(from).trim());
    }

    if (to) {
      const toStr = String(to).trim();
      // Nếu chỉ nhập ngày (YYYY-MM-DD), mở rộng đến cuối ngày
      if (/^\d{4}-\d{2}-\d{2}$/.test(toStr)) {
        whereConditions.push('ds.recorded_at <= ?');
        params.push(`${toStr} 23:59:59`);
      } else {
        whereConditions.push('ds.recorded_at <= ?');
        params.push(toStr);
      }
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Đếm tổng số bản ghi
    const countParams = [...params];
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM DataSensor ds JOIN Sensor s ON ds.sensor_id = s.sensor_id ${whereClause}`,
      countParams
    );
    const total = countResult[0].total;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 20));
    const totalPages = Math.ceil(total / limitNum);
    const offset = (pageNum - 1) * limitNum;

    // Truy vấn dữ liệu với phân trang
    const [rows] = await pool.query(
      `SELECT ds.*, s.sensor_name, s.sensor_type, s.unit
       FROM DataSensor ds
       JOIN Sensor s ON ds.sensor_id = s.sensor_id
       ${whereClause}
       ORDER BY ds.recorded_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    res.json({
      data: rows.map(formatSensorData),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    });
  } catch (error) {
    console.error('Get sensor data error:', error);
    res.status(500).json({ message: 'Lỗi server!' });
  }
};
