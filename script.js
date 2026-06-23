// Event Listener function code to display live character count in a textarea
const sendContent = document.getElementById('sendContent');
const charCount = document.getElementById('charCount');
const updateContent = document.getElementById('updateContent');
const charCount2 = document.getElementById('charCount2');

sendContent.addEventListener('input', () => {
    if(sendContent.value.length<2500){
        charCount.innerHTML = "<span class='listObj'>" + sendContent.value.length + " / 2500 characters</span>";
    }
    else{
        charCount.innerHTML = "<b><span class='listObj' style='color: red'>" + sendContent.value.length + " / 2500 characters</span></b>";
    }
})
updateContent.addEventListener('input', () => {
    if(updateContent.value.length<2500){
        charCount2.innerHTML = "<span class='listObj'>" + updateContent.value.length + " / 2500 characters</span>";
    }
    else{
        charCount2.innerHTML = "<b><span class='listObj' style='color: red'>" + updateContent.value.length + " / 2500 characters</span></b>";
    }
})
// Function for 'Copy Text' and 'Copy Code' buttons to copy text in the output text area to clipboard
async function copyFn(){
    let op = document.getElementById("output")
    let val = op.value
    try{
        await navigator.clipboard.writeText(val)
        let button = document.getElementById('copy1')
        button.textContent = "Copied!"

        setTimeout( () => {
            button.textContent = "Copy Text"
        }, 2500)
    }
    catch(err){
        alert("Failed to copy:"+err)
    }
}
async function copyFn2(){
    let op = document.getElementById("sendCode")
    let val = op.value
    try{
        await navigator.clipboard.writeText(val)
        let button = document.getElementById('copy2')
        button.textContent = "Copied!"

        setTimeout( () => {
            button.textContent = "Copy Code"
        }, 2500)
    }
    catch(err){
        alert("Failed to copy:"+err)
    }
}
// Send Feedback to the developer -- Feedback Page Interface with Node.js
async function sendFeedback(event){
    event.preventDefault();

    const fdb = document.getElementById('feedback')
    let value = fdb.value
    
    const response = await fetch('/sendFeedback', {
        method: "POST",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `feedback=${encodeURIComponent(value)}`
    })
    if(response.ok){
        alert("Feedback sent successfully! Thank you for your valuable feedback!")
        fdb.value = ""
    }
    else{
        alert("Error 413 - Payload Too Large")
    }
}

// Send Clipboard Content -- Home Page Sender Section interface with Node.js
async function sendClipBoard(event){
    event.preventDefault();
    const content = document.getElementById("sendContent").value
    const pwd = document.getElementById("sendPassword").value
    const ttlh = document.getElementById("sendTTLHours").value
    const ttlm = document.getElementById("sendTTLMinutes").value
    const ttls = document.getElementById("sendTTLSeconds").value
    const rkt = document.getElementById("readKTimes").value
    const wpkt = document.getElementById("passwordKTimes").value
    const upkt = document.getElementById("updateKTimes").value

    const ttl = String(Math.max(30, Number(ttlh)*3600  + Number(ttlm) * 60 + Number(ttls)))
    
    if(Number(rkt)>0 && Number(upkt)>Number(rkt)){
        alert("Update count must always be less than or equal to the read count if you are setting the read count value i.e., when you are setting a read count value and not giving unlimited reads.")
        return
    }
    
        // Prevents empty string and the string containing only whitespaces to be sent
    if(content.trim()===""){
        alert("There is no content to be sent.\
\nThe content that you are trying to send may be empty or it may contain \
only white spaces.")
    }
    else{
        const response = await fetch('/sendClipboard', {
            method: "POST",
            headers: {
                "Content-Type":"application/x-www-form-urlencoded"
            },
            body: `Content=${encodeURIComponent(content)}&maxReadCount=${rkt}&expireSeconds=${ttl}&maxWrongPwdCount=${wpkt}&maxUpdateLimit=${upkt}&password=${encodeURIComponent(pwd)}`
        })
        const sCode = document.getElementById("sendCode")
        sCode.value = await response.text()

        if(response.ok){
            alert("Data sent successfully!!!\nThank you for using this website!")
        }
        else if(response.status===413){
            alert("Error 413 - Payload Too Large")
        }
        else if(response.status===400){
            alert("Error 400 - Bad Request")
        }
        else{
            alert("Connection Error")
        }
    }
}
// Retrieve Clipboard Content -- Home Page Receiver Section interface with Node.js

async function retreiveClipBoard(event){
    event.preventDefault();
    const clipID = Number(document.getElementById("clipID").value)
    const clipPass = document.getElementById("clipPass").value

    const response = await fetch('/retreiveClipboard', {
        method: "POST",
        headers: {
            "Content-Type":"application/x-www-form-urlencoded"
        },
        body: `clipID=${clipID}&clipPass=${encodeURIComponent(clipPass)}`
    })

    const resText = document.getElementById("output")
    let textVal = await response.text()
    if(response.ok){
        if(textVal===""){
            resText.value = ""
            alert("Clipboard ID or password may be invalid or the Clipboard \
you are searching for might have got expired or the maximum read count \
or the maximum wrong password count of the clipboard with \
that ID might have been reached.\n\
Otherwise there might be an issue from the developer's side as well. \
If you feel that the clipBoard ID and password \
that you entered is correct and the clipboard with that ID still \
has time before getting expired and the maximum read count \
and the maximum wrong password count has not been reached, then \
please let the developer know it by \
sending the issue in the feedback page of this website.\n\
Sorry for the inconvinience!!!\n\
Thank you!!!")
        }
        else{
            resText.value = textVal
        }
    }
    else if(response.status==400){
        alert("Error 400 - Bad Request")
        resText.value = ""
    }
    else{
        alert("Clipboard ID or password may be invalid or the Clipboard \
you are searching for might have got expired or the maximum read count \
or the maximum wrong password count of the clipboard with \
that ID might have been reached.\n\
Otherwise there might be an issue from the developer's side as well. \
If you feel that the clipBoard ID and password \
that you entered is correct and the clipboard with that ID still \
has time before getting expired and the maximum read count \
and the maximum wrong password count has not been reached, then \
please let the developer know it by \
sending the issue in the feedback page of this website.\n\
Sorry for the inconvinience!!!\n\
Thank you!!!")
        resText.value=""
    }
}

function downloadTxtFile(){
    const contentVal = document.getElementById('output').value
    if(contentVal.trim()===""){
        alert("There is no content to download to file.")
    }
    else{
        // Create a Blob class object | Blob --> Binary Large Object
        const blob = new Blob([contentVal], {type: 'text/plain'})
        // Create an anchor tag
        const tempLink = document.createElement('a')
        // Create a url from the blob
        const url = window.URL.createObjectURL(blob)
        // add href and download parameter to the anchor tag
        tempLink.href = url
        tempLink.download = "clipboardContent.txt"
        // add anchor tag to DOM
        document.body.appendChild(tempLink)
        // click the link
        tempLink.click()
        // remove anchor tag from the DOM
        document.body.removeChild(tempLink)
        // delete the URL
        URL.revokeObjectURL(url)
        // alert the user
        alert("File has been downloaded successfully.")
    }
}

// Password show and hide logic
/* Logic Used:
        Step - 1: Button is pressed
        Step - 2: Type of input field is changed
        Step - 3: Text of button is changed to "See Now"
        Step - 4: Input field of password entering is disabled while viewing
        Step - 5: After 5.5 seconds i.e., 5500 ms all are back to normal state
*/

function showPassword1(){
    let button = document.getElementById("showPwd1")
    let sendPwd = document.getElementById("sendPassword")

    if(button.textContent === "See Now"){
        return
    }
    sendPwd.type = "text"
    button.textContent = "See Now"
    sendPwd.disabled = true;
    setTimeout( ()=> {
        sendPwd.type = "password"
        button.textContent = "Show Password"
        sendPwd.disabled = false;
    }, 5500)
}

function showPassword2(){
    let button = document.getElementById("showPwd2")
    let sendPwd = document.getElementById("clipPass")

    if(button.textContent === "See Now"){
        return
    }
    clipPass.type = "text"
    button.textContent = "See Now"
    clipPass.disabled = true;
    setTimeout( ()=> {
        clipPass.type = "password"
        button.textContent = "Show Password"
        clipPass.disabled = false;
    }, 5500)
}
// Function for Tab Concept -- Show sender or receiver at one time
function showSenderSection(){
    let ssec = document.getElementById("senderSectionComponent")
    let rsec = document.getElementById("receiverSectionComponent")
    ssec.style.display = "block"
    rsec.style.display = "none"
}
function showReceiverSection(){
    let ssec = document.getElementById("senderSectionComponent")
    let rsec = document.getElementById("receiverSectionComponent")
    ssec.style.display = "none"
    rsec.style.display = "block"
}

// Update clipboard function
async function updateClipboard(){
    const clipID = Number(document.getElementById("clipID").value)
    const clipPass = document.getElementById("clipPass").value
    const updateText = document.getElementById("updateContent").value
    const response = await fetch("/updateClipboard", {
        method: "POST",
        headers: {"Content-Type":"application/x-www-form-urlencoded"},
        body: `clipID=${clipID}&clipPass=${encodeURIComponent(clipPass)}&updateText=${encodeURIComponent(updateText)}`
    })
    if(response.ok){
        alert("Update Successful!!\n\
Thanks for using this website!!")
    }
    else if(response.status==413){
        alert("Error 413 - Payload Too Large")
    }
    else if(response.status==400){
        alert("Error 400 - Bad Request")
    }
    else{
        alert("Update Failed.\n\
The update limit may be exhausted or the clipboard ID might have been set read-only or the clipboard ID may not exist.")
    }
}