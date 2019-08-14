/*
 * @Author: Yuan
 * @Date: 2019-08-14 11:05:42
 * @LastEditors: Yuan
 * @LastEditTime: 2019-08-14 15:00:08
 * @Description: 文件功能
 */

const axios = require('axios');
const che = require('cheerio')
const readline = require('readline');
let xlsx = require('xlsx');
var fs= require('fs');
// let cityList = ["1936", "1144", "650", "580", "465", "811", "38", "218", "1351", "1022", "921", "1799", "2287", "2818", "2208", "349", "1682", "2492", "2082", "3037", "20", "1506", "2246", "793", "2936", "3118"]
let cityList = []

console.log("输入Cookie:(例如SESSION=734e3218-d3b9-4ee2-b590-a406f82ed1b0)");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var cookie = "";
rl.on('line', function (input) {
  cookie = input || "SESSION=734e3218-d3b9-4ee2-b590-a406f82ed1b0";
  rl.close();
});


rl.on('close', function () {
  // console.log('程序结束');
  // process.exit(0);
  getPage()
});


async function getPage() {
  //请求页码信息
  let cityInfo = []; //储存城市信息
  let libInfo = [];//城市图书馆信息
  //省份列表
  let res = await axios.get("https://alipay.dataesb.com/chooselib", {
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1",
      "Cookie": cookie
    }
  })
  if (res.status !== 200) {
    console.log("Cookie错误,请重新输入")
    rl.line()
    return
  }
  var $ = che.load(res.data)
  $(".am-filter-item").each(function () {
    $(this).attr("cityid") && cityList.push($(this).attr("cityid"))
  })
  console.log(cityList)
  //获取城市信息
  for (const city of cityList) {
    let res = await axios.get(`https://alipay.dataesb.com/region/city?provinceId=${city}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1",
          "Cookie": cookie
        }
      }
    )
    // 添加城市信息到列表中
    res.data.cities.forEach(city => {
      cityInfo.push(city)
    });
    // await sleep(100)
  }
  console.log(cityInfo.length + "个城市")
  // 获取城市下图书馆信息 
  for (let i = 0; i < cityInfo.length; i++) {
    let res = await axios.get(`https://alipay.dataesb.com/user/city/lib?cityCode=${cityInfo[i].adCode}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1",
          "Cookie": cookie
        }
      }
    )
    res.data.forEach(n => {
      libInfo.push(n)
      console.log(`已添加${n.name}`)
    })
    console.log(`已获取${cityInfo[i].cityName}信息`)
    await sleep(50)
  }
  console.log(libInfo.length + "个图书馆")
  // 输出为Excel
  outExcel(libInfo)
}
//输出outExcel
function outExcel(libInfo) {
  let ss = xlsx.utils.json_to_sheet(libInfo); //通过工具将json转表对象
  let keys = Object.keys(ss).sort(); //排序 [需要注意，必须从A1开始]

  let ref = keys[1] + ':' + keys[keys.length - 1]; //这个是定义一个字符串 也就是表的范围[A1:C5] 

  let workbook = { //定义操作文档
    SheetNames: ['图书馆列表'], //定义表明
    Sheets: {
      '图书馆列表': Object.assign({}, ss, { '!ref': ref }) //表对象[注意表明]
    },
  }
  let t = new Date();
  xlsx.writeFile(workbook, `./图书馆信息-${t.getFullYear()}-${t.getMonth() + 1}-${t.getDay()}.xlsx`); //将数据写入文件
  fs.writeFileSync(`./图书馆信息-${t.getFullYear()}-${t.getMonth() + 1}-${t.getDay()}.json`,JSON.stringify(libInfo))
}

async function sleep(timeout) {
  return new Promise(r => {
    setTimeout(() => {
      r()
    }, timeout);
  })
}
