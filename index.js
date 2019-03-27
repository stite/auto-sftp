/*
 * @Author: XiaoMing 
 * @Date: 2019-03-26 14:07:06 
 * @Last Modified by: Xiao.Ming
 * @Last Modified time: 2019-03-27 10:39:15
 */
const fs = require('fs');
const Client = require('ssh2-sftp-client');

const configJson = {
  // 服务器地址
  host: '192.20.01.10',
  // 服务器端口--默认端口22
  port: '22',
  // 用户名
  username: 'appadmin',
  // 是否开启文件改动时上传(默认为false)
  watch: true,
  // 密码
  password: 'abcdefg',
  // 本地目录
  localPath: '/Users/caoxiaoming/work/恒拓/mzone/dist/web',
  // 需要上传到服务器的目录，没有默认为要目录
  remoteFilePath:'/work/resource/html/mzone/dist'
}


let pathArray = [];
let uploadTime = null;
let wacthTime = null;
const fastPut = (localPath,remoteFilePath,type) => {
  pathArray.push({
    localPath,
    remoteFilePath,
    type
  });
}

const upload = async () => {
  console.log('\033[32m 准备上传 \033[39m');
  for(let item of pathArray){
    await new Promise(function(resolve, reject) {
      const sftp = new Client();
      sftp.connect(configJson).then(() => {
        if(item.type){
          return sftp.mkdir(item.remoteFilePath, item.type);
        } else {
          return sftp.put(item.localPath,item.remoteFilePath);
        };
      }).then((data) => {
        console.log(item.localPath +' \033[34m 上传成功 \033[39m');
        resolve();
      }).catch((err) => {
        resolve();
      });
      sftp.on('error', error => {
        if(error.level == 'client-timeout'){
          console.log(' \033[31m 连接服务器请求超时 \033[39m');
        }
        process.exit();
      })
    });
  }
  console.log('\033[32m 全部上传完成 \033[39m');
  pathArray = [];
  if(!configJson.watch){
    process.exit();
  }
}

const dirEach  = (...path) =>{
  let [localPath,remoteFilePath] = [...path];
  let type = fs.statSync(localPath).isDirectory();
  fs.readdir(localPath, (err,path) => {
    path.forEach(element => {
      const Path = `${localPath}/${element}`;
      const remotePath = `${remoteFilePath}/${element}`
      const types = fs.statSync(Path).isDirectory();
      if(types){
        fastPut(Path,remotePath,types);
        dirEach(Path,remotePath);
      } else {
        fastPut(Path,remotePath,false);
        clearTimeout(uploadTime);
        uploadTime = setTimeout(() => {
          upload();
        },500);
      }
    })
  })
}

const ready = () => {
  fs.readdir(configJson.localPath, (err,path) => {
    path.forEach(element => {
      const localPath = `${configJson.localPath}/${element}`;
      const remoteFilePath = `${configJson.remoteFilePath || '/`'}/${element}`
      const type = fs.statSync(localPath).isDirectory();
      if(type){
        fastPut(localPath,remoteFilePath,type);
        dirEach(localPath,remoteFilePath);
      } else {
        fastPut(localPath,remoteFilePath,false);
      }
    });
  });
  
}

if(configJson.watch){
  ready();
  fs.watch(configJson.localPath,{encoding:'utf8',recursive:true}, (eventType, filename) => {
    if (filename) {
      const localPath = `${configJson.localPath}/${filename.toString()}`;
      const remoteFilePath = `${configJson.remoteFilePath}/${filename.toString()}`;
      pathArray.push({
        localPath,
        remoteFilePath,
        type:false
      });
      clearTimeout(wacthTime);
      wacthTime = setTimeout(() => {
        upload();
      },1000);
    }
  });
} else {
  ready();
}
