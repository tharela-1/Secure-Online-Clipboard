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
// Function for 'Copy Retrieved Text' and 'Copy clipboard id' and 'Copy revoke id' buttons to copy text 
// in the output text area to clipboard
async function copyFn(){
    let op = document.getElementById("output")
    let val = op.value
    try{
        await navigator.clipboard.writeText(val)
        let button = document.getElementById('copy1')
        button.textContent = "Copied!"

        setTimeout( () => {
            button.textContent = "Copy Retrieved Text"
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
            button.textContent = "Copy Clipboard ID"
        }, 2500)
    }
    catch(err){
        alert("Failed to copy:"+err)
    }
}
async function copyFn3(){
    let op = document.getElementById("revokeCode")
    let val = op.value
    try{
        await navigator.clipboard.writeText(val)
        let button = document.getElementById('copy3')
        button.textContent = "Copied!"

        setTimeout( () => {
            button.textContent = "Copy Revoke ID"
        }, 2500)
    }
    catch(err){
        alert("Failed to copy:"+err)
    }
}
async function copyFn4(){
    let op = document.getElementById("ownerCode")
    let val = op.value
    try{
        await navigator.clipboard.writeText(val)
        let button = document.getElementById('copy4')
        button.textContent = "Copied!"

        setTimeout( () => {
            button.textContent = "Copy Owner ID"
        }, 2500)
    }
    catch(err){
        alert("Failed to copy:"+err)
    }
}
// Send Feedback to the developer -- Feedback Page Interface with Node.js
async function sendFeedback(event){
  // If internet failed need try catch block
    try{
      event.preventDefault();  
      const fdb = document.getElementById('feedback')
      let value = fdb.value
      let trimVal = fdb.value.trim()
      if(trimVal.length<=0){
        alert("Feedback string can't be empty and it can't contain only whitespaces.\n\
There must be atleast 1 non-space character to send feedback.")
      }
      else{
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
        else if(response.status === 500){
          // To handle if DB is unavailable
          alert("Error 500 - Some DB or Server error might have occurred. Please try later.\
  \nAlso please check your internet connection!")
        }
        else if(response.status === 400){
          alert("Error 400 - Bad Request\n\
Feedback string can't be empty and it can't contain only whitespaces.\n\
There must be atleast 1 non-space character to send feedback.")
        }
        else{
            alert("Error 413 - Payload Too Large")
        }
      }
    }
    catch(err){
      alert("Network error! Please Check your internet connection!")
    }
}

// Send Clipboard Content -- Home Page Sender Section interface with Node.js
async function sendClipBoard(event){
  try{
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
        const rCode = document.getElementById("revokeCode")
        const ocode = document.getElementById("ownerCode")
        let value = await response.text()
        if(response.ok){
          let valArray = value.split(" ")
            sCode.value = valArray[0]
            rCode.value = valArray[1]
            ocode.value = valArray[2]
            alert("Data sent successfully!!!\nThank you for using this website!")
        }
        else if(response.status===413){
            alert("Error 413 - Payload Too Large")
        }
        else if(response.status===400){
            alert("Error 400 - Bad Request")
        }
        else if(response.status === 500){
          alert("Error 500 - Some DB or Server error might have occurred. Please try later.\
\nAlso please check your internet connection!")
        }
        else{
            alert("Connection Error")
        }
    }
  }
  catch(err){
    alert("Network error! Please Check your internet connection!")
  }
}
// Retrieve Clipboard Content -- Home Page Receiver Section interface with Node.js

async function retreiveClipBoard(event){
  try{
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
    else if(response.status === 500){
      alert("Error 500 - Some DB or Server error might have occurred. Please try later.\
\nAlso please check your internet connection!")
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
  catch(err){
    alert("Network error! Please Check your internet connection!")
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
    sendPwd.type = "text"
    button.textContent = "See Now"
    sendPwd.disabled = true;
    setTimeout( ()=> {
        sendPwd.type = "password"
        button.textContent = "Show Password"
        sendPwd.disabled = false;
    }, 5500)
}

function showPassword3(){
    let button = document.getElementById("showPwd3")
    let sendPwd = document.getElementById("clipPass2")

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

function showPassword4(){
    let button = document.getElementById("showPwd4")
    let sendPwd = document.getElementById("clipPass3")

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

// Function for Tab Concept -- Show sender, receiver or revoke tab at one time
function showSenderSection(){
    let ssec = document.getElementById("senderSectionComponent")
    let rsec = document.getElementById("receiverSectionComponent")
    let revsec = document.getElementById("revokeSectionComponent")
    let osec = document.getElementById("ownerSectionComponent")
    let lsec = document.getElementById("loginSectionComponent")
    let ressec = document.getElementById("resultSectionComponent")
    ssec.style.display = "block"
    rsec.style.display = "none"
    revsec.style.display = "none"
    osec.style.display = "none"
    lsec.style.display = "none"
    ressec.style.display = "none"
}
function showReceiverSection(){
    let ssec = document.getElementById("senderSectionComponent")
    let rsec = document.getElementById("receiverSectionComponent")
    let revsec = document.getElementById("revokeSectionComponent")
    let osec = document.getElementById("ownerSectionComponent")
    let lsec = document.getElementById("loginSectionComponent")
    let ressec = document.getElementById("resultSectionComponent")
    ssec.style.display = "none"
    rsec.style.display = "block"
    revsec.style.display = "none"
    osec.style.display = "none"
    lsec.style.display = "none"
    ressec.style.display = "none"
}
function showRevokeSection(){
    let ssec = document.getElementById("senderSectionComponent")
    let rsec = document.getElementById("receiverSectionComponent")
    let revsec = document.getElementById("revokeSectionComponent")
    let osec = document.getElementById("ownerSectionComponent")
    let lsec = document.getElementById("loginSectionComponent")
    let ressec = document.getElementById("resultSectionComponent")
    ssec.style.display = "none"
    rsec.style.display = "none"
    revsec.style.display = "block"
    osec.style.display = "none"
    lsec.style.display = "none"
    ressec.style.display = "none"
}
function showOwnerSection(){
    let ssec = document.getElementById("senderSectionComponent")
    let rsec = document.getElementById("receiverSectionComponent")
    let revsec = document.getElementById("revokeSectionComponent")
    let osec = document.getElementById("ownerSectionComponent")
    let lsec = document.getElementById("loginSectionComponent")
    let ressec = document.getElementById("resultSectionComponent")
    ssec.style.display = "none"
    rsec.style.display = "none"
    revsec.style.display = "none"
    osec.style.display = "block"
    lsec.style.display = "block"
    ressec.style.display = "none"
}
function showLoginSection(){
    let ssec = document.getElementById("senderSectionComponent")
    let rsec = document.getElementById("receiverSectionComponent")
    let revsec = document.getElementById("revokeSectionComponent")
    let osec = document.getElementById("ownerSectionComponent")
    let lsec = document.getElementById("loginSectionComponent")
    let ressec = document.getElementById("resultSectionComponent")
    ssec.style.display = "none"
    rsec.style.display = "none"
    revsec.style.display = "none"
    osec.style.display = "block"
    lsec.style.display = "block"
    ressec.style.display = "none"
}
function showResultSection(){
    let ssec = document.getElementById("senderSectionComponent")
    let rsec = document.getElementById("receiverSectionComponent")
    let revsec = document.getElementById("revokeSectionComponent")
    let osec = document.getElementById("ownerSectionComponent")
    let lsec = document.getElementById("loginSectionComponent")
    let ressec = document.getElementById("resultSectionComponent")
    ssec.style.display = "none"
    rsec.style.display = "none"
    revsec.style.display = "none"
    osec.style.display = "block"
    lsec.style.display = "none"
    ressec.style.display = "block"
}
// Update clipboard function
async function updateClipboard(){
  try{
    const clipID = Number(document.getElementById("clipID").value)
    const clipPass = document.getElementById("clipPass").value
    const updateText = document.getElementById("updateContent").value
    const response = await fetch("/updateClipboard", {
        method: "PATCH",
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
    else if(response.status === 500){
      alert("Error 500 - Some DB or Server error might have occurred. Please try later.\
\nAlso please check your internet connection!")
    }
    else{
        alert("Update Failed.\n\
The update limit may be exhausted or the clipboard ID might have been set as read-only or the clipboard ID may not exist.")
    }
  }
  catch(err){
    alert("Network error! Please Check your internet connection!")
  }
}
// Recommend TTL, Read count, Wrong password count, Update Count using heuristic based approach

function randomInt(start, end){
  return Math.floor(Math.random()*Math.abs(end-start+1))+start
}
function recommendMe(){
  let msg = document.getElementById("sendContent")
  
  let ttlh = document.getElementById("sendTTLHours")
  let ttlm = document.getElementById("sendTTLMinutes")
  let ttls = document.getElementById("sendTTLSeconds")
  let readcnt = document.getElementById("readKTimes")
  let wpwdcnt = document.getElementById("passwordKTimes")
  let updatecnt = document.getElementById("updateKTimes")

  /*
  Things to recommend:
  1. TTL -- Time To Live
  2. Read count
  3. Wrong password count
  4. Update Count
  */

  // Convert message to lower case
  let message = msg.value.toLowerCase()
  if(message.trim().length === 0){
    alert("Please type something to get recommendation")
  }
  else if(message.length>2500){
    alert("Message length can be a maximum of 2500 characters")
  }
  else{

     /*
    Heuristic Recommendation - Priority Order:
    1. OTP KeyWords -- TTL between 1 min and 2 min, only 1 read count, max of 2 wrong password attempts and no updates allowed
    2. Password Keywords -- TTL between 2 min and 5 min, 1 - 3 read count, max of 3 - 5 wrong password attempts and no updates allowed
    3. Banking Keywords -- TTL between 5 min and 10 min, 1 - 3 read count, max of 3 wrong password attempts and max 1 updates allowed
    4. ID Keywords -- TTL between 8 min and 15 min, 2 - 5 read count, max of 5 wrong password attempts and max 1 updates allowed
    5. Email ID -- TTL between 12 min and 20 min, 2 - 5 read count, max of 5 wrong password attempts and max 1 updates allowed
    6. Usernames -- TTL between 20 min and 30 min, 6 - 10 read count, max of 10 - 15 wrong password attempts and max 2 updates allowed
    7. Meeting notes -- TTL between 40 min and 4 hrs , 20 - 50 read count, max of 60 - 75 wrong password attempts and max 4 - 5 updates allowed
    8. Source Code -- TTL between 2 hrs and 6 hrs , 10 - 25 read count, max of 80 - 100 wrong password attempts and max 5 - 10 updates allowed
    9. General Chat -- TTL is set to 23 hrs 59 min 59 sec, unlimited read count, unlimited wrong password count, 100 - 150 updates allowed
    */


    // OTPs are highest priority
    let otpKeywords = ['otp','one time password','one-time-password','one_time_password',
      'verification-code','onetimepassword','verification code', 'access-token', 'access token',
      'access_token', 'access_key', 'access key', 'access-key', 'secret key', 'secret-key',
      'secret_key', 'secret token', 'secret-token', 'secret_token', 'secret pin', 'secret-pin',
      'secret_pin', 'secret', 'validation code', 'validation-code', 'validation_code', 'secure pin',
      'secure-pin', 'secure_pin', 'security code', 'security_code', 'security-code', 'one_time', 
      'one time', 'one-time', 'secure', 'security'
    ]

    // Passwords are next priority
    let passwordKeywords = ['password', 'pwd', 'passwd', 'pass word', 'passcode', 'pass code', 'secret code',
      'secret-code', 'secret_code', 'api_key', 'apikey', 'api key', 'api-key', 'key', 'private', 'authentication',
      'env', '.env', 'aes_key', 'aes key', 'jwt key', 'jwt_key', 'aes-key', 'jwt-key'
    ]

    // Banking details are next priority
    let bankingKeywords = ['card', 'cheque', 'credit', 'debit', 'neft', 'rtgs', 'imps', 'fixed deposit', 
      'fixed_deposit', 'fixed-deposit', 'savings', 'expenses', 'emi', 'loan', 'interest', 
      'intrest', 'fd', 'policy', 'insurance', 'life insurance', 'life-insurance', 'life_insurance', 
      'passbook', 'pass book', 'pass-book', 'pass_book', 'asset', 'gold', 'silver', 
      'money', 'currency', 'amount', 'deposit', 'withdraw', 'cash', 'demand', 'draft', 'dd', 
      'stock', 'mutual fund', 'mutual-fund', 'mutual_fund', 'dividend', 'challan', 'chellan', 'pay',
      'upi', 'fund', 'tax', 'salary', 'income', 'bank', 'nominee', 'nominnee', 'account', 'revenue',
      'profit', 'loss', 'market', 'pension', 'rate'
    ]

    // Identity based words are the next priority
    let idKeywords = ['id card', 'id_card', 'id-card', 'government id', 'government-id', 'government_id',
      'identity card', 'identity_card', 'identity-card', 'proof', 'identity', 'document', 'visa', 'passport',
      'pass port', 'address', 'id'
    ]

    // Email check has to be done - split into words and check if each word is a valid email or not
    let emailRegex = /^[a-zA-Z0-9.-_%+]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    
    // Usernames are next priority
    let usernameKeywords = ['username', 'user name', 'user id', 'userid', 'id', 'user-name', 'user_name',
      'user_id'
    ]

    // Meeting notes are next priority
    let meetingKeywords = ['list', 'meeting', 'minutes of the meeting', 'minutes-of-the-meeting',
      'minutes_of_the_meeting', 'summary', 'meeting minutes', 'meeting-minutes', 'meeting_minutes', 'notes'
    ]

    // Source codes are next priority
    let srccodeKeywords = ['source code', 'code', 'source_code', 'source-code', 'file', 'folder', 'directory',
      'repository', '#include', 'class', 'function', 'var', 'let', 'const', 'def', 'extends', 'import', 'public', 
      'private', 'using namespace', 'export', 'package', 'json', '[]', 'int ', 'char ', 'print', 'console.log',
      'System.out.print', 'async', 'await', 'yield', '=>', 'string', 'null', 'undefined', '/*', '*/', '++', 'for',
      'while'
    ]

    // Now checking each condition
    let otpCond = false
    let passCond = false
    let bankCond = false
    let idCond = false
    let emailCond = false
    let usernameCond = false
    let meetingCond = false
    let srcCond = false
    let generalCond = false

    // otp condition check
    for(let i=0; i<otpKeywords.length;i++){
      if(message.includes(otpKeywords[i])){
        otpCond = true
        break
      }
    }
    // password condition check
    for(let i=0; i<passwordKeywords.length;i++){
      if(message.includes(passwordKeywords[i])){
        passCond = true
        break
      }
    }
    // banking condition check
    for(let i=0;i<bankingKeywords.length;i++){
      if(message.includes(bankingKeywords[i])){
        bankCond = true
        break
      }
    }
    // ID cards condition check
    for(let i=0;i<idKeywords.length;i++){
      if(message.includes(idKeywords[i])){
        idCond = true
        break
      }
    }
    // email condition check
    let msgarr = message.split(" ")
    for(let i=0;i<msgarr.length;i++){
      if (emailRegex.test(msgarr[i])){
        emailCond = true
      }
    }
    // User names condition check
    for(let i=0;i<usernameKeywords.length;i++){
      if(message.includes(usernameKeywords[i])){
        usernameCond = true
        break
      }
    }
    // Meeting notes condition check
    for(let i=0;i<meetingKeywords.length;i++){
      if(message.includes(meetingKeywords[i])){
        meetingCond = true
        break
      }
    }
    // Source Code condition check
    let srccount = 0
    for(let i=0;i<srccodeKeywords.length;i++){
      if(message.includes(srccodeKeywords[i])){
        srccount+=1
        break
      }
    }
    if(srccount>=4){
      srcCond = true
    }
    if(!otpCond && !passCond && !bankCond && !idCond && !emailCond && !usernameCond && !meetingCond && !srcCond){
      generalCond = true
    }
    // Now all conditions have been checked
    // Now we have to make the decision

    if(otpCond){
      let totalTTL = randomInt(60,120)
      ttlh.value = Math.floor(totalTTL/3600)
      ttlm.value = Math.floor((totalTTL%3600)/60)
      ttls.value = Math.floor(totalTTL%60)
      readcnt.value = 1
      wpwdcnt.value = 2
      updatecnt.value = 0
    }
    else if(passCond){
      let totalTTL = randomInt(120,300)
      ttlh.value = Math.floor(totalTTL/3600)
      ttlm.value = Math.floor((totalTTL%3600)/60)
      ttls.value = Math.floor(totalTTL%60)
      readcnt.value = randomInt(1,3)
      wpwdcnt.value = randomInt(3,5)
      updatecnt.value = 0
    }
    else if(bankCond){
      let totalTTL = randomInt(300,600)
      ttlh.value = Math.floor(totalTTL/3600)
      ttlm.value = Math.floor((totalTTL%3600)/60)
      ttls.value = Math.floor(totalTTL%60)
      readcnt.value = randomInt(1,3)
      wpwdcnt.value = 3
      updatecnt.value = 1
    }
    else if(idCond){
      let totalTTL = randomInt(480,900)
      ttlh.value = Math.floor(totalTTL/3600)
      ttlm.value = Math.floor((totalTTL%3600)/60)
      ttls.value = Math.floor(totalTTL%60)
      readcnt.value = randomInt(2,5)
      wpwdcnt.value = 5
      updatecnt.value = 1
    }
    else if(emailCond){
      let totalTTL = randomInt(720,1200)
      ttlh.value = Math.floor(totalTTL/3600)
      ttlm.value = Math.floor((totalTTL%3600)/60)
      ttls.value = Math.floor(totalTTL%60)
      readcnt.value = randomInt(2,5)
      wpwdcnt.value = 5
      updatecnt.value = 1
    }
    else if(usernameCond){
      let totalTTL = randomInt(1200,1800)
      ttlh.value = Math.floor(totalTTL/3600)
      ttlm.value = Math.floor((totalTTL%3600)/60)
      ttls.value = Math.floor(totalTTL%60)
      readcnt.value = randomInt(6,10)
      wpwdcnt.value = randomInt(10,15)
      updatecnt.value = 2
    }
    else if(meetingCond){
      let totalTTL = randomInt(2400,14400)
      ttlh.value = Math.floor(totalTTL/3600)
      ttlm.value = Math.floor((totalTTL%3600)/60)
      ttls.value = Math.floor(totalTTL%60)
      readcnt.value = randomInt(20,50)
      wpwdcnt.value = randomInt(60,75)
      updatecnt.value = randomInt(4,5)
    }
    else if(srcCond){
      let totalTTL = randomInt(7200,21600)
      ttlh.value = Math.floor(totalTTL/3600)
      ttlm.value = Math.floor((totalTTL%3600)/60)
      ttls.value = Math.floor(totalTTL%60)
      readcnt.value = randomInt(10, 25)
      wpwdcnt.value = randomInt(80,100)
      updatecnt.value = randomInt(5,10)
    }
    else{
      let totalTTL = 86399
      ttlh.value = Math.floor(totalTTL/3600)
      ttlm.value = Math.floor((totalTTL%3600)/60)
      ttls.value = Math.floor(totalTTL%60)
      readcnt.value = 0
      wpwdcnt.value = 0
      updatecnt.value = randomInt(100,150)
    }
  }
}

// Instant delete feature
async function revokeClipBoard(event){
  try{
    event.preventDefault()
    let clipID = document.getElementById("clipID2").value
    let clipPass = document.getElementById("clipPass2").value
    let revokeID = document.getElementById("revokeID").value

    const response = await fetch("/instantDelete",{
      method: "DELETE",
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: `clipID=${clipID}&clipPass=${encodeURIComponent(clipPass)}&revokeID=${revokeID}`
    })

    if(response.ok){
      alert("Clipboard Deleted Successfully!!")
    }
    else if(response.status === 500){
      alert("Error 500 - Some DB or Server error might have occurred. Please try later. \
\nAlso please check your internet connection!")
    }
    else{
      alert("Clipboard Deletion Failed!!")
    }
  }
  catch(err){
    alert("Network error! Please Check your internet connection!")
  }
}

// Implementation of Owner Dashboard feature
async function ownerOfClipBoard(event){
  try{
    event.preventDefault()
    let ssec = document.getElementById("senderSectionComponent")
    let rsec = document.getElementById("receiverSectionComponent")
    let revsec = document.getElementById("revokeSectionComponent")
    let osec = document.getElementById("ownerSectionComponent")
    let lsec = document.getElementById("loginSectionComponent")
    let ressec = document.getElementById("resultSectionComponent")
    ssec.style.display = "none"
    rsec.style.display = "none"
    revsec.style.display = "none"
    osec.style.display = "block"
    lsec.style.display = "block"
    ressec.style.display = "none"

    // Now get the input values
    const clipID = document.getElementById("clipID3").value
    const clipPass = document.getElementById("clipPass3").value
    const ownerID = document.getElementById("ownerID").value

    const response = await fetch("/getOwnerDetails", {
      method: "POST",
      headers: {'Content-Type':'application/x-www-form-urlencoded'},
      body: `clipID=${encodeURIComponent(clipID)}&clipPass=${encodeURIComponent(clipPass)}&ownerID=${encodeURIComponent(ownerID)}`
    })
    if(response.ok){

      const jsonDoc = await response.json() // using .json() because what we get is a stringified JSON document

      // Changing the Tab Layouts

      ssec.style.display = "none"
      rsec.style.display = "none"
      revsec.style.display = "none"
      osec.style.display = "block"
      lsec.style.display = "none"
      ressec.style.display = "block"

      // Get the output fields now
      let showClipID = document.getElementById("showClipID")
      let showClipMsg = document.getElementById("showClipMsg")
      let showClipTTL = document.getElementById("showClipTTL")
      let showClipDate = document.getElementById("showClipDate")
      let showClipRC = document.getElementById("showClipRC")
      let showClipMRC = document.getElementById("showClipMRC")
      let showClipWPC = document.getElementById("showClipWPC")
      let showClipMWPC = document.getElementById("showClipMWPC")
      let showClipUC = document.getElementById("showClipUC")
      let showClipMUC = document.getElementById("showClipMUC")
      let showClipRID = document.getElementById("showClipRID")
      let showClipOID = document.getElementById("showClipOID")

      // Put the values now
      showClipID.value = jsonDoc.clipBoardID
      showClipMsg.value = jsonDoc.message
      showClipTTL.value = jsonDoc.expireSeconds
      showClipDate.value = jsonDoc.expiresAt
      showClipRC.value = jsonDoc.readCount
      showClipMRC.value = jsonDoc.maxReadCount
      showClipWPC.value = jsonDoc.wrongPwdCount
      showClipMWPC.value = jsonDoc.maxWrongPwdCount
      showClipUC.value = jsonDoc.updateCount
      showClipMUC.value = jsonDoc.maxUpdateLimit
      showClipRID.value = jsonDoc.revokeID
      showClipOID.value = jsonDoc.ownerID
    }
    else{
      if(response.status === 400){
        alert("Check your inputs and try again. Credentials may be invalid also. Your clipboard might have got deleted.")
      }
      else if(response.status === 410){
        alert("Check your inputs and try again. Credentials may be invalid also. Your clipboard might have got deleted.")
      }
      else if(response.status === 413){
        alert("Check your inputs and try again. Credentials may be invalid also. Your clipboard might have got deleted.")
      }
      else if(response.status === 404){
        alert("Check your inputs and try again. Credentials may be invalid also. Your clipboard might have got deleted.")
      }
      else if(response.status === 429){
        alert("Check your inputs and try again. Credentials may be invalid also. Your clipboard might have got deleted.")
      }
      else if(response.status === 500){
        alert("Error 500 - Internal System Error\nPlease try again after some time.\n\
If issue persists, then send feedback to the developer.")
      }
      else{
        alert("Some error occurred. Check your inputs or wait for some time and try again.")
      }
    }
  }
  catch(err){
    alert("Network error! Please Check your internet connection!")
  }
}