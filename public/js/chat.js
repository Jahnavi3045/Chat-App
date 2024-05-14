const socket=io()
const $msgForm=document.querySelector('#msg-form')
const $inputMsg=$msgForm.querySelector('#textBox')
const $formButton=$msgForm.querySelector('#send')
const $sendLocationButton=document.querySelector('#location')
const $messages=document.querySelector('#messages')


const messageTemplate=document.querySelector('#msg-template').innerHTML
const locationTemplate=document.querySelector('#location-template').innerHTML
const sideBarTemplate=document.querySelector('#sideBar-template').innerHTML

const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})
// socket.on('countUpdated',(count)=>{
//     console.log("count has been updated"+count)
// })

// document.querySelector("#increment").addEventListener('click',()=>{
//     console.log("clciked")
//     socket.emit('increase')
// })

const autoScroll=()=>{
    const $newMessage=$messages.lastElementChild

    const newMessageStyles=getComputedStyle($newMessage)
    const newMessageMargin=parseInt(newMessageStyles.marginBottom)
    const newMessageHeight=$newMessage.offsetHeight+newMessageMargin

    const visibleHeight=$messages.offsetHeight

    const containerHeight=$messages.scrollHeight

    const scrollOffset=$messages.scrollTop+visibleHeight

    if(containerHeight-newMessageHeight<=scrollOffset){
        $messages.scrollTop=$messages.scrollHeight
    }
}

socket.on('message',(message)=>{
    console.log(message)
    const html=Mustache.render(messageTemplate,{
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})
socket.on('locationMessage',(message)=>{
    console.log(message)
    const html=Mustache.render(locationTemplate,{
        username:message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

socket.on('roomData',({room,users})=>{
    const html=Mustache.render(sideBarTemplate,{
        room,
        users
    })
    document.querySelector('.chat_sideBar').innerHTML=html
})

$msgForm.addEventListener('submit',(e)=>{
    e.preventDefault()
    $formButton.setAttribute('disabled','disabled')
    // const text=document.querySelector('#textBox').value
    const text=e.target.elements.messages.value
    // console.log("message sent")
    socket.emit('msgSent',text,(error)=>{
        $formButton.removeAttribute('disabled')
        $inputMsg.value=''
        $inputMsg.focus()
        if(error){
            return console.log(error)
        }
        console.log("message delivered")
    })
})

$sendLocationButton.addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('geolocation is not supported on your browser')
    }
    $sendLocationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((pos)=>{
        // console.log(pos)
        socket.emit('sendLocation',{
            latitude:pos.coords.latitude,
            longitude:pos.coords.longitude
        },()=>{
            $sendLocationButton.removeAttribute('disabled')
            console.log("location shared")
        })
    },undefined,{enableHighAccuracy:false})
})

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})