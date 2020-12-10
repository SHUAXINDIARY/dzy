const express = require('express');
const router = express.Router();
const axios = require('axios')
const key = require('./key').key

// 请求高德api
const get = (address) => {
  return axios
    .get(`https://restapi.amap.com/v3/geocode/geo`, {
      params: {
        key: key,
        address,
        output: "JSON",
        batch: true
      }
    })
}
let hotData = []
const filter = async (arr) => {
  hotData = []
  let address = "", addressList = [], i = 0, cache = []
  // 过滤批量请求的address
  arr.forEach(item => {
    address += `${item.address}|`
    cache.push({
      count: item.quantity
    })
    if (i === 9) {
      addressList.push(address)
      hotData.push(cache)
      address = ''
      cache = []
      i = 0
    }
    i++
  })
  // 创建多个promise
  const promise = addressList.map(item => {
    return get(item)
  })
  // 请求
  return await Promise.all(promise)
}

// 获取所有数据
router.get('/getData', async function (req, res, next) {
  const list = await axios.get('https://asset.duozhuayu.com/dev/orders.json')
  const data = await filter(list.data)
  const locations = data.map(obj => {
    const arr = obj.data.geocodes.map(item => {
      return item.location
    })
    return arr
  })
  locations.forEach((item, i) => {
    item.forEach((val, j) => {
      const position = val.split(',')
      hotData[i][j].lng = position[0]
      hotData[i][j].lat = position[1]
    })
  })
  res.send({
    hotData,
    len: list.data.length
  });
});

module.exports = router;
