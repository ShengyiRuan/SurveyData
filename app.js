const express = require('express');
const mysql = require('mysql');
const ejs = require('ejs');

const app = express();
app.set('view engine', 'ejs');
app.set('views', './views');

// 创建数据库连接池
const pool = mysql.createPool({
    host: 'forritu1.mysql.database.azure.com',
    user: 'maxwell',
    password: 'guztiw-3Fefqu-retnyv',
    database: 'surveys',
    ssl: {
        rejectUnauthorized: true
    }
});

// 根路由显示统计数据
app.get('/', (req, res) => {
  pool.query('SELECT * FROM survey_summary', (err, results) => {
      if (err) {
          console.error('Database query error:', err);
          res.render('error', { error: 'Database query failed' });
          return;
      }

      const stats = {
          total: results.length,
          version1: { count: 0, questions: {} },
          version2: { count: 0, questions: {} }
      };

      results.forEach(r => {
          const versionKey = `version${r.version}`;
          stats[versionKey].count++;

          for (let i = 1; i <= 10; i++) {
              const questionKey = `Q${i}_Answer`;
              if (r[questionKey] !== null) {
                  if (!stats[versionKey].questions[questionKey]) {
                      stats[versionKey].questions[questionKey] = {};
                  }
                  if (!stats[versionKey].questions[questionKey][r[questionKey]]) {
                      stats[versionKey].questions[questionKey][r[questionKey]] = 0;
                  }
                  stats[versionKey].questions[questionKey][r[questionKey]]++;
              }
          }
      });

      // 计算百分比
      Object.keys(stats).forEach(version => {
          if (version !== 'total') {
              Object.keys(stats[version].questions).forEach(question => {
                  Object.keys(stats[version].questions[question]).forEach(option => {
                      let count = stats[version].questions[question][option];
                      let percentage = (count / stats[version].count * 100).toFixed(2);
                      stats[version].questions[question][option] = { count, percentage };
                  });
              });
          }
      });

      // 渲染视图并传递统计数据
      res.render('index', { stats });
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
