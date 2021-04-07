//io() function receives the data from the server it receives the event as 1 parameter and the other data in callback function
const socket=io()

//DOM Manipulation

const $form=document.querySelector('#message-form')
const $form_input=document.querySelector('input')
const $form_button=document.querySelector('button')
const $location_button=document.querySelector("#send-location")
const $messages=document.querySelector("#messages")

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate=document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML


// autoscrolling
const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

// options for query string
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })
socket.emit('join', { username, room },(error)=>
{
    if(error)
    {
        alert(error)
        location.href="/"
    }
})

socket.on('message',(message)=>
{
    console.log(message)
    const html = Mustache.render(messageTemplate, {username:message.username,message:message.text,createdAt:moment(message.createdAt).format('MMMM Do YYYY, h:mm:ss a')})
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage',(message)=>
{
    console.log(message)
    const html=Mustache.render(locationTemplate,{username:message.username,url:message.url,createdAt:moment(message.createdAt).format('h:mm:ss a')})
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})


socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$form.addEventListener('submit',(e)=>
{
    e.preventDefault();
    //disabling the form button until the data inside input is not sent
    $form_button.setAttribute('disabled','disabled')

    //getting input from input tag
    const msg=e.target.elements.message.value

    //emit func takes 3 param 1 is event 2 is data to be sent 3 is acknowledgement(optional) 
    //on takes 2 params 1 is event 2 is function which takes data and ackno.. callback
    socket.emit('chat',msg,(error)=>
    {
        //enabling the form button
        $form_button.removeAttribute('disabled')
        $form_input.value=''
        $form_input.focus()
      if(error)
      return console.log(error)

      console.log("Message delivered")
    })
})


// for location

$location_button.addEventListener('click',()=>
{ 
  if(!navigator.geolocation)
  return alert("No access to the location")
 
  $location_button.setAttribute('disabled','disabled')
  navigator.geolocation.getCurrentPosition((position)=>
  {
      console.log(position)
      socket.emit('sendLocation',{latitude:position.coords.latitude,longitude:position.coords.longitude},()=>
      {
          $location_button.removeAttribute('disabled')
          console.log("Location shared successfully")
      })
  })
  
 
})



//on receives data
// socket.on('countsay',(count)=>
// {
//     console.log("count is",count)
// })

// document.querySelector("#btn").addEventListener('click',()=>
// {
//     console.log('clicked')
//     socket.emit('increment')
// })