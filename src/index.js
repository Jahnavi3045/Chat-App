const express=require('express')
const http=require('http')
const path=require('path')
const socketio=require('socket.io')
const Filter=require('bad-words')
const {generateMessage,generateLocation}=require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom}=require('./utils/users')

const app=express()
const server=http.createServer(app)
const io=socketio(server)

const publicDirectoryPath=path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))

// let count=0

io.on('connection',(socket)=>{
    console.log("web socket connection")
    
    // socket.emit('countUpdated',count)

    // socket.on('increase',()=>{
    //     count++;
    //     // socket.emit('countUpdated',count)
    //     io.emit('countUpdated',count)
    // })
    socket.on('join',({username,room},callback)=>{
        const {error,user}=addUser({id:socket.id,username,room})

        if(error){
            return callback(error)
        }
        
        socket.join(user.room)
        socket.emit('message',generateMessage('System','welcome!!'))
        socket.broadcast.to(user.room).emit('message',generateMessage('System',`${user.username} has joined!!!`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })

        callback()
    })

    
    socket.on('msgSent',(msg,callback)=>{
        // console.log(msg)
        const user=getUser(socket.id)
        const filter=new Filter()

        if(filter.isProfane(msg)){
            return callback("profanity is not allowed!!!")
        }
        
        io.to(user.room).emit('message',generateMessage(user.username,msg))
        callback()
    })
    socket.on('disconnect',()=>{
        const user=removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('System',`${user.username} has left the group`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
    })

    socket.on('sendLocation',(coords,callback)=>{
        const user=getUser(socket.id)
        
        io.to(user.room).emit('locationMessage',generateLocation(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })
})
server.listen(3000,()=>{
    console.log("connected")
})