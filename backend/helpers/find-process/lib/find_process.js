/*
* @Author: zoujie.wzj
* @Date:   2016-01-23 18:25:37
* @Last Modified by: Sahel LUCAS--SAOUDI
* @Last Modified on: 2021-11-12
*/

'use strict'

const path = require('path');
const utils = require('./utils');

function matchName (text, name) {
  if (!name) {
    return true
  }
  // make sure text.match is valid, fix #30
  if (text && text.match) {
    return text.match(name)
  }
  return false
}

function fetchBin (cmd) {
  const pieces = cmd.split(path.sep)
  const last = pieces[pieces.length - 1]
  if (last) {
    pieces[pieces.length - 1] = last.split(' ')[0]
  }
  const fixed = []
  for (const part of pieces) {
    const optIdx = part.indexOf(' -')
    if (optIdx >= 0) {
      // case: /aaa/bbb/ccc -c
      fixed.push(part.substring(0, optIdx).trim())
      break
    } else if (part.endsWith(' ')) {
      // case: node /aaa/bbb/ccc.js
      fixed.push(part.trim())
      break
    }
    fixed.push(part)
  }
  return fixed.join(path.sep)
}

function fetchName (fullpath) {
  if (process.platform === 'darwin') {
    const idx = fullpath.indexOf('.app/')
    if (idx >= 0) {
      return path.basename(fullpath.substring(0, idx))
    }
  }
  return path.basename(fullpath)
}

const finders = {
  darwin (cond) {
    return new Promise((resolve, reject) => {
      let cmd
      if ('pid' in cond) {
        cmd = `ps -p ${cond.pid} -ww -o pid,ppid,uid,gid,args`
      } else {
        cmd = 'ps ax -ww -o pid,ppid,uid,gid,args'
      }

      utils.exec(cmd, function (err, stdout, stderr) {
        if (err) {
          if ('pid' in cond) {
            // when pid not exists, call `ps -p ...` will cause error, we have to
            // ignore the error and resolve with empty array
            resolve([])
          } else {
            reject(err)
          }
        } else {
          err = stderr.toString().trim()
          if (err) {
            reject(err)
            return
          }

          const data = utils.stripLine(stdout.toString(), 1)
          const columns = utils.extractColumns(data, [0, 1, 2, 3, 4], 5).filter(column => {
            if (column[0] && cond.pid) {
              return column[0] === String(cond.pid)
            } else if (column[4] && cond.name) {
              return matchName(column[4], cond.name)
            } else {
              return !!column[0]
            }
          })

          let list = columns.map(column => {
            const cmd = String(column[4])
            const bin = fetchBin(cmd)

            return {
              pid: parseInt(column[0], 10),
              ppid: parseInt(column[1], 10),
              uid: parseInt(column[2], 10),
              gid: parseInt(column[3], 10),
              name: fetchName(bin),
              bin: bin,
              cmd: column[4]
            }
          })

          if (cond.config.strict && cond.name) {
            list = list.filter(item => item.name === cond.name)
          }

          resolve(list)
        }
      })
    })
  },
  linux: 'darwin',
  sunos: 'darwin',
  freebsd: 'darwin',
  win32 (cond) {
    return new Promise((resolve, reject) => {
      let execFile = require('child_process').exec;

      // const cmd = 'Get-WmiObject -class win32_process | select Name,ProcessId,ParentProcessId,CommandLine,ExecutablePath'
      let lines = [];

      execFile('wmic process get Name,ParentProcessId,ProcessId', function (e, stdout, stderr) {
        if(e) {
          return reject();
        }

        lines = stdout.trim().split("\n");

        let task_list = [];

        for(let l of lines) {
          let task = {};

          let line_split = l.split('  ');

          for(let i = 0; i < line_split.length; i++) {
            if(i === 0) {
              task.name = line_split[0];
            } else {
              let int = Number.parseInt(line_split[i]);

              if(!Number.isNaN(int)) {
                if(!('ppid' in task)) {
                  task.ppid = int;
                } else if(!('pid' in task)) {
                  task.pid = int;
                }
              }
            }
          }

          if('ppid' in task && 'pid' in task) {
            task_list.push(task);
          }
        }

        let filtered_list = [];

        for(let l of task_list) {
          if('pid' in cond) {
            if(l.pid === cond.pid) {
              filtered_list.push(l);
            }
          } else if (cond.name) {
            if(l.name.includes(cond.name)) {
              filtered_list.push(l);
            }
          }
        }

        return resolve(filtered_list);

      });
    });
  },
  android (cond) {
    return new Promise((resolve, reject) => {
      const cmd = 'ps'

      utils.exec(cmd, function (err, stdout, stderr) {
        if (err) {
          if ('pid' in cond) {
            // when pid not exists, call `ps -p ...` will cause error, we have to
            // ignore the error and resolve with empty array
            resolve([])
          } else {
            reject(err)
          }
        } else {
          err = stderr.toString().trim()
          if (err) {
            reject(err)
            return
          }

          const data = utils.stripLine(stdout.toString(), 1)
          const columns = utils.extractColumns(data, [0, 3], 4).filter(column => {
            if (column[0] && cond.pid) {
              return column[0] === String(cond.pid)
            } else if (column[1] && cond.name) {
              return matchName(column[1], cond.name)
            } else {
              return !!column[0]
            }
          })

          let list = columns.map(column => {
            const cmd = String(column[1])
            const bin = fetchBin(cmd)

            return {
              pid: parseInt(column[0], 10),
              // ppid: void 0,
              // uid: void 0,
              // gid: void 0,
              name: fetchName(bin),
              bin,
              cmd
            }
          })

          if (cond.config.strict && cond.name) {
            list = list.filter(item => item.name === cond.name)
          }

          resolve(list)
        }
      })
    })
  }
}

function findProcess (cond) {
  const platform = process.platform

  return new Promise((resolve, reject) => {
    if (!(platform in finders)) {
      return reject(new Error(`platform ${platform} is unsupported`))
    }

    let find = finders[platform]
    if (typeof find === 'string') {
      find = finders[find]
    }

    find(cond).then(resolve, reject)
  })
}

module.exports = findProcess
