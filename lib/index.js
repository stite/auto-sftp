/*
 * @Author: XiaoMing 
 * @Date: 2019-03-26 14:07:06 
 * @Last Modified by: Xiao.Ming
 * @Last Modified time: 2019-03-28 16:35:15
 */
const fs = require('fs');
const Client = require('ssh2-sftp-client');
const configJson = require('../config.json');
let pathArray = [];
let dirArray = [];
let pathNumber = 0;
let dirNumber = 0;
let uploadTime = null;
let wacthTime = null;
const fastPut = (localPath,remoteFilePath,type) => {
  if(type){
    dirArray.push({
      localPath,
      remoteFilePath,
    })
  } else {
    pathArray.push({
      localPath,
      remoteFilePath,
    });
  }
}

// 上传完成
const uploadEnd = () => {
  console.log('\033[32m 全部上传完成 \033[39m');
  pathArray = [];
  dirArray = [];
  pathNumber = 0;
  dirNumber = 0;
  if(!configJson.watch){
    process.exit();
  }
}

// 上传函数
const upload = (isDir) => {
  const sftp = new Client();
  sftp.connect(configJson).then((d) => {
    if(!isDir){
      console.log('\033[32m 准备上传文件夹 \033[39m');
      for(let item of dirArray){
        sftp.mkdir(item.remoteFilePath, item.type).then(d => {
          console.log(d +' \033[34m 上传成功 \033[39m');
          dirNumber++;
          if(dirNumber == dirArray.length){
            upload(true);
          }
        }).catch(error => {
          dirNumber++;
          if(dirNumber == dirArray.length){
            upload(true);
          }
        })
      }
    } else {
      console.log('\033[32m 准备上传文件 \033[39m');
      for(let item of pathArray){
        sftp.put(item.localPath,item.remoteFilePath).then(d => {
          console.log(d +' \033[34m 上传成功 \033[39m');
          pathNumber++;
          if(pathNumber == pathArray.length){
            uploadEnd();
          }
        }).catch(error => {
          console.log(' \033[31m '+error+' \033[39m');
        })
      }
    }
  }).catch((e)=>{
    console.log(e)
  });
}

// 遍历文件夹
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

// 初始化遍历
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
        clearTimeout(uploadTime);
        uploadTime = setTimeout(() => {
          upload();
        },500);
      }
    });
  });
  
}

// 是否开启监听
if(configJson.watch){
  ready();
  fs.watch(configJson.localPath,{encoding:'utf8',recursive:true}, (eventType, filename) => {
    if (filename) {
      const localPath = `${configJson.localPath}/${filename.toString()}`;
      const remoteFilePath = `${configJson.remoteFilePath}/${filename.toString()}`;
      pathArray.push({
        localPath,
        remoteFilePath,
      });
      clearTimeout(wacthTime);
      wacthTime = setTimeout(() => {
        upload(true);
      },1000);
    }
  });
} else {
  ready();
}
