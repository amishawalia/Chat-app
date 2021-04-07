const express=require('express')
const path=require('path')
const http=require('http')
const socketio=require('socket.io')
const Filter=require('bad-words')
const {generateMessage,generateLocationMessage}=require('./utils/messages.js')
const {addUser,removeUser,getUser,getUsersInRoom}=require('./utils/users')

const app=express()
const server=http.createServer(app)
const io=socketio(server)//we needed a raw htpp server to pass to socket.io to add its functionalities to http


const public_path=path.join(__dirname,'../public')

//rendering the static files from server
app.use(express.static(public_path))

app.get('/index',(req,res)=>
{
    res.send('hbfbhfhex')
})

// setting the connection for socket.io 1 param is event 
io.on('connection',(socket)=>
{
    console.log("new connection")

    // socket.emit('message',generateMessage('Welcome!'))
    // //now to show msg that a user has joined we use broadcast with emit
    // // it will show that event to all the clients except itself
    // socket.broadcast.emit('message',generateMessage("A new user joined the chat room"))

    socket.on('join', (options,callback) => {

        const {error,user}=addUser({id:socket.id,...options})

        if(error)
        {
            return callback(error)
        }
        socket.join(user.room)//inbuilt socket event for joining room

        socket.emit('message', generateMessage('Admin','Welcome'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined!`))// will boradcast to clients present in a room
        
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
        // socket.emit, io.emit, socket.broadcast.emit
        // io.to.emit, socket.broadcast.to.emit//events for rooms
    })

    socket.on('chat',(msg,callback)=>
    {
        const user=getUser(socket.id)
        const filter=new Filter()
        if(filter.isProfane(msg))
        return callback("Bad words not allowed")

      io.to(user.room).emit('message',generateMessage(user.username,msg))
      callback()
    })

   //location on server side
   socket.on('sendLocation',(coords,callback)=>
   {
       const user=getUser(socket.id)
       io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
   })

    // broadcasting that the user left the chat room
    //we use socket.on with inbuilt event disconnect

    socket.on('disconnect',()=>
    {
        const user=removeUser(socket.id)
        if(user)
        io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left!`))
        io.to(user.room).emit('roomData', {
                room:user.room,
                users: getUsersInRoom(user.room)
            })
    })
})

server.listen(3000,()=>
{
    console.log("this is on browser 3000");
})




  //sending event(data) to client
    //socket.emit('countsay',count)
    //socket.on receiving updated data from client
    // socket.on('increment',(count)=>
    // {
    //     count++;
    //     socket.emit('countsay',count)
    // })

//     // for all the clients we write io
    // socket.on('increment',()=>
    // {
    //     count++;
    //     io.emit('countsay',count)
    // })