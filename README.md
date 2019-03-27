### Node-Sftp

工作调试需要上传到服务器上验证一些功能，用FTP工具下传下载的太麻烦了，写了个小脚本，自动上传文件，解放拉下拉下的动作了

* 支持配置选项

* 支持文件更新时自动上传

## 配置文件
```js
const configJson = {
  // 服务器地址
  host: '192.10.11.15',
  // 服务器端口--默认端口22
  port: '22',
  // 用户名
  username: 'appadmin',
  // 是否开启文件改动时上传(默认为false)
  watch: true,
  // 密码
  password: '****',
  // 本地目录
  localPath: '/mzone/dist/web',
  // 需要上传到服务器的目录，没有默认为要目录
  remoteFilePath:'/dist'
}
```


### 使用
- clone 当前项目
- 在项目根目录执行`npm install`
- 填写index.js配置选项
- 开始上传`npm run start`

