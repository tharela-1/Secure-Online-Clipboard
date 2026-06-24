const http = require('http')
const fs = require('fs')
const querystring = require('querystring')
const crypto = require('crypto')
const mongodb = require('mongodb')
const bcrypt = require('bcrypt')
require('dotenv').config()
const MongoClient = new mongodb.MongoClient(process.env.MONGO_URI)

/* Logic to generate the 12 - digit random number:

Formula: Math.random() + (10^12 - 10^11) + (10^11) 
Logic: If the value generated is not in the db its fine otherwise regenerate it 
*/
async function randomFn(){
    const sb2 = MongoClient.db("Clipboard")
    const cb2 = sb2.collection("clipboard")
    let data = await cb2.find().toArray()
    let rl = data.map((item) => {
        Number(item.clipBoardID)
    })
    let cond = true
    let val;
    while(cond){
        val = Math.floor(Math.random()*900000000000+100000000000)
        if(val in rl){
            cond = true
        }
        else{
            cond = false
        }
    }
    return val
}
/* Next Logic: Protection Logic 
    1. Message must be encrypted
    2. Password must be hashed
*/

// Password hashing
async function pwdHashing(password){
    const hashval = await bcrypt.hash(password,Number(process.env.BUFFER_SALT_ROUNDS))
    return hashval
}

// Message encryption
/* Logic: 
    Step - 1: Have 5 keys in the .env file and pick the random AES key
    Step - 2: Create a random iv key
    Step - 3: Call the createCipheriv() fn to create an encryption tool
    Step - 4: Use the update() fn to do the encryption
    Step - 5: Call the cipher.final() to call the final bytes
    Step - 6: Get the authTag and then return the message and the authTag
*/
function randomIndex(){
    return Math.floor(Math.random() * 4 + 0)
}
function generateIV(){
    return crypto.randomBytes(12);
}
function msgEncryption(message, randomIndex, ivBuffer){
    let keys = [process.env.AES_KEY_1, process.env.AES_KEY_2, process.env.AES_KEY_3,
        process.env.AES_KEY_4, process.env.AES_KEY_5]
    let myKey = Buffer.from(keys[randomIndex],'hex')
    const cipher = crypto.createCipheriv('aes-256-gcm',myKey,ivBuffer)
    let encryptedMsg = cipher.update(message,'utf8','hex')
    encryptedMsg+=cipher.final('hex')
    const authTag = cipher.getAuthTag()
    return {
        message: encryptedMsg,
        authTag: authTag.toString('hex')
    }
}

// Main component: Connect to DB and do all the operations
async function connectDB(){
    try{
        await MongoClient.connect()
        console.log("Connected successfully")

        const db = MongoClient.db("Feedback")
        const fb = db.collection("feedback")
        const sb = MongoClient.db("Clipboard")
        const cb = sb.collection("clipboard")
        /*Collect the following usage analytics such as:
            1. Number of clipboards generated
            2. Number of reads done
            3. Number of updates done
            4. Number of clipboards deleted based on read count
            5. Number of clipboards deleted based on wrong password count*/
        const adb = MongoClient.db("Analytics")
        const ab = adb.collection("analytics")
        // setting up the TTL index and the index based on clipboard ID
        await cb.createIndex({expiresAt: 1}, {expireAfterSeconds: 0})
        await cb.createIndex({clipBoardID: 1})
        http.createServer((req, res)=>{

            // Basic routing to load all the HTML, CSS and the JS pages
            // Using ReadStream to increase the speed of the operations.
            const url = req.url
            const method = req.method

            if(url === '/'){
                res.statusCode = 301 // Redirection to welcome page
                res.setHeader('Location','/welcome')
                return res.end()
            }
            else if(url==='/welcome'){
                res.writeHead(200, {"content-type": 'text/html'})
                fs.createReadStream('./welcome.html').pipe(res)
            }
            else if(url === '/home'){
                res.writeHead(200, {"content-type": 'text/html'})
                fs.createReadStream('./index.html').pipe(res)
            }
            else if(url === '/style.css'){
                res.writeHead(200, {'content-type':'text/css'})
                fs.createReadStream('./style.css').pipe(res)
            }
            else if(url === '/script.js'){
                res.writeHead(200,{'content-type':'application/javascript'})
                fs.createReadStream('./script.js').pipe(res)
            }
            else if(url === '/help'){
                res.writeHead(200,{'content-type':'text/html'})
                fs.createReadStream('./help.html').pipe(res)
            }
            else if(url === '/feedback'){
                res.writeHead(200,{'content-type':'text/html'})
                fs.createReadStream('./feedback.html').pipe(res)
            }
            else if(method === 'POST' && url==='/sendFeedback'){
                let body = ""
                req.on('data',(chunk)=>{
                    body+=chunk
                })
                req.on('end',async()=>{
                    const data = querystring.parse(body)
                    // Backend length verification for feedback
                    if(data.feedback.length>1000){
                        res.writeHead(413, {"Content-Type":"text/plain"})
                        res.end()
                    }
                    else{
                        await fb.insertOne({
                            feedback: data.feedback
                        })
                        res.writeHead(200, {"Content-Type":"text/plain"})
                        res.end()
                    }
                    
                })
            }
            // Sender Section
            else if(method==='POST' && url==="/sendClipboard"){
                let body = ""
                req.on('data',(chunk)=>{
                    body+=chunk
                })
                req.on('end', async()=>{
                    let data = querystring.parse(body)
                    // Backend length and TTL Verification for sender's side
                    if(data.Content.length>2500 || data.password.length>64){
                        res.writeHead(413, {"Content-Type":"text/plain"})
                        res.end()
                    }
                    else if(data.Content.length<0 || data.Content.trim().length===0 || data.password.length<=0 || 
                    Number(data.expireSeconds)>86399 ||  Number(data.expireSeconds)<0){
                        res.writeHead(400, {"Content-Type":"text/plain"})
                        res.end()
                    }
                    else if(Number(data.maxReadCount)>2049 || Number(data.maxReadCount)<0 || 
                        Number(data.maxWrongPwdCount)>100 || Number(data.maxWrongPwdCount)<0 || Number(data.maxUpdateLimit)>2049 ||
                    Number(data.maxUpdateLimit)<0){
                        res.writeHead(400, {"Content-Type":"text/plain"})
                        res.end()
                    }
                    else if(Number(data.maxUpdateLimit)>Number(data.maxReadCount) && Number(data.maxReadCount)>0){
                        res.writeHead(400, {"Content-Type":"text/plain"})
                        res.end()
                    }
                    else{
                        let clipID = String(await randomFn())
                        let pwdHashed = String(await pwdHashing(data.password))
                        let rIndex = String(randomIndex())
                        let iv = generateIV()
                        let ivstr = iv.toString('hex')
                        let encryptedObj = msgEncryption(data.Content, rIndex, iv)
                        let encryptedMsg = encryptedObj.message
                        let authTag = encryptedObj.authTag
                        await cb.insertOne({
                            clipBoardID: Number(clipID),
                            message: encryptedMsg,
                            authTag: authTag,
                            readCount: 0,
                            maxReadCount: Number(data.maxReadCount),
                            wrongPwdCount: 0,
                            maxWrongPwdCount: Number(data.maxWrongPwdCount),
                            updateCount: 0,
                            maxUpdateLimit: Number(data.maxUpdateLimit),
                            expireSeconds: Math.max(30,Number(data.expireSeconds)),
                            expiresAt: new Date(Date.now()+Math.max(30,Number(data.expireSeconds))*1000),
                            password: String(pwdHashed),
                            keyIndex: Number(rIndex),
                            iv: ivstr
                        })
                        // Analytics of number of clipboards generated is collected
                        await ab.updateOne({param: "clipboardsGeneratedCount"},{$inc: {count: 1}}, {upsert: true})
                        res.writeHead(200, {"Content-Type":"text/plain"})
                        res.end(String(clipID))
                    }
                })
            }
            // Receiver's section
            else if(method==='POST' && url==='/retreiveClipboard'){
                let body = ""
                req.on('data',(chunk)=>{
                    body+=chunk
                })
                req.on('end', async()=>{
                    let data = querystring.parse(body)
                    let clipID = Number(data.clipID)
                    let clipPass = String(data.clipPass)
                    if(data.clipID.length!=12 || clipPass.length>64){
                        res.writeHead(400,{"Content-Type":"text/plain"})
                        res.end()
                    }
                    else{
                        const rl = []
                        const clipDoc = await cb.findOne({clipBoardID: clipID})
                        // Check whether the clipboard ID exists or not
                        if(clipDoc){
                            // Check whether the password matches or not
                            const matchCheck = await bcrypt.compare(clipPass, clipDoc.password)
                            if(matchCheck===true){
                                try{
                                    // Before doing decryption and sending the message to the receiver
                                    // we need to check the no of read times
                                    // Check readcounter value
                                    // User opted if maxval>0
                                    if(clipDoc.maxReadCount>0){
                                        // if readCount>=maxval delete otherwise add 1
                                        if(clipDoc.readCount>=clipDoc.maxReadCount){
                                            await cb.deleteOne({clipBoardID: clipID})
                                            // Analytics of number of clipboards deleted based on read count is collected
                                            await ab.updateOne({param: "clipboardsDeletedBasedOnReadCount"},
                                                {$inc: {count: 1}}, {upsert: true})
                                            res.end()
                                        }
                                        else{
                                            await cb.updateOne({clipBoardID: clipID},{
                                                $inc: {readCount: 1}
                                            })
                                            // Analytics of number of read count is collected
                                            await ab.updateOne({param: "clipboardsReadCount"},
                                                {$inc: {count: 1}}, {upsert: true})
                                            const keyList = [process.env.AES_KEY_1, process.env.AES_KEY_2,
                                                process.env.AES_KEY_3, process.env.AES_KEY_4, 
                                                process.env.AES_KEY_5]
                                            let keyChosen = Buffer.from(keyList[clipDoc.keyIndex], 'hex')
                                            let authTagGot = Buffer.from(clipDoc.authTag, 'hex')
                                            let ivNeeded = Buffer.from(clipDoc.iv,'hex')
                                            let encryptedMessage = clipDoc.message

                                            const decipherObj = crypto.createDecipheriv('aes-256-gcm',
                                                keyChosen,ivNeeded)
                                            decipherObj.setAuthTag(authTagGot)
                                            let decryptedMessage = decipherObj.update(encryptedMessage,
                                                'hex','utf8')
                                            decryptedMessage+=decipherObj.final('utf8')
                                            // Read has been done so delete if limit exceeds
                                            if(clipDoc.readCount+1>=clipDoc.maxReadCount){
                                                await cb.deleteOne({clipBoardID: clipID})
                                                // Analytics of number of clipboards deleted based on read count is collected
                                                await ab.updateOne({param: "clipboardsDeletedBasedOnReadCount"},
                                                    {$inc: {count: 1}}, {upsert: true})
                                                res.end(decryptedMessage)
                                            }
                                            else{
                                                res.end(decryptedMessage)
                                            }
                                        }
                                    }
                                    // If user didn't opt for this setting --> 
                                    // No need to update the read count
                                    else{
                                        // Analytics of number of read count is collected
                                        await ab.updateOne({param: "clipboardsReadCount"},
                                            {$inc: {count: 1}}, {upsert: true})
                                        const keyList = [process.env.AES_KEY_1, process.env.AES_KEY_2,
                                            process.env.AES_KEY_3, process.env.AES_KEY_4, 
                                            process.env.AES_KEY_5]
                                        let keyChosen = Buffer.from(keyList[clipDoc.keyIndex], 'hex')
                                        let authTagGot = Buffer.from(clipDoc.authTag, 'hex')
                                        let ivNeeded = Buffer.from(clipDoc.iv,'hex')
                                        let encryptedMessage = clipDoc.message

                                        const decipherObj = crypto.createDecipheriv('aes-256-gcm',
                                            keyChosen,ivNeeded)
                                        decipherObj.setAuthTag(authTagGot)
                                        let decryptedMessage = decipherObj.update(encryptedMessage,
                                            'hex','utf8')
                                        decryptedMessage+=decipherObj.final('utf8')
                                        res.end(decryptedMessage)
                                    }   
                                }
                                catch(err){
                                    console.log(err)
                                    res.end()
                                }
                            }
                            else{
                                // It is found that the user has entered the wrong password
                                // Before ending check the no of wrong pwd attempts counter
                                // If maxval>0 then increase wrongcount by 1 
                                //      if exceeds max val then delete the record from the database
                                if(clipDoc.maxWrongPwdCount>0){
                                    
                                    if(clipDoc.wrongPwdCount+1>=clipDoc.maxWrongPwdCount){
                                        await cb.deleteOne({clipBoardID: clipID})
                                        // Analytics of number of clipboards deleted based on wrong
                                        // password count is collected
                                        await ab.updateOne({param: "clipboardsDeletedBasedOnWrongPasswordCount"},
                                            {$inc: {count: 1}}, {upsert: true})
                                    }
                                    else{
                                        await cb.updateOne({clipBoardID: clipID},
                                            {$inc: {wrongPwdCount: 1}
                                        })
                                    }
                                }
                                res.end()
                            }
                        }
                        else{
                            // If clipBoard ID is not found
                            res.writeHead(404, {'content-type':'text/plain'})
                            res.end()
                        }
                    }
                })
            }
            else if(method==="PATCH" && url==="/updateClipboard"){
                
                let body = ""
                req.on('data',(chunk)=>{
                    body+=chunk
                })
                req.on('end', async()=>{
                    let data = querystring.parse(body)
                    let clipID = Number(data.clipID)
                    let clipPass = String(data.clipPass)
                    let updateText = String(data.updateText)
                    if(updateText.trim().length === 0  || updateText.length<=0 ||
                        data.clipID.length!=12 || clipPass.length<=0){
                        res.writeHead(400, {'content-type':'text/plain'})
                        res.end()
                    }
                    else if(updateText.length>2500 || clipPass.length>64){
                        res.writeHead(413, {'content-type':'text/plain'})
                        res.end()
                    }
                    else{
                        let rec = await cb.findOne({clipBoardID: clipID})
                        if(rec){
                            if(rec.updateCount>=rec.maxUpdateLimit){
                                // If update limit exceeded or clipboard is read-only
                                res.writeHead(403, {'content-type':'text/plain'})
                                res.end()
                            }
                            // Compare whether password mathces or not
                            else{
                                const matchCheck = await bcrypt.compare(clipPass, rec.password)
                                if(matchCheck){
                                    // Password is correct
                                    
                                    // Encrypt the updated text
                                    let rIndex = randomIndex()
                                    let ivNeeded = generateIV()
                                    let encrypted = msgEncryption(updateText, rIndex, ivNeeded)
                                    let encryptedMessage = encrypted.message.toString("hex")
                                    let authTag = encrypted.authTag
                                    // Incremented update count
                                    await cb.updateOne({clipBoardID: clipID},
                                        {$set: {
                                            keyIndex: rIndex,
                                            authTag: authTag,
                                            message: encryptedMessage,
                                            iv: ivNeeded.toString("hex")
                                        },
                                        $inc: {updateCount: 1}})
                                    
                                    // Analytics of number of update count is collected
                                    await ab.updateOne({param: "clipboardsUpdateCount"},
                                        {$inc: {count: 1}}, {upsert: true})
                                    // Send normal end
                                    res.end()
                                }
                                else{
                                    // User has entered the wrong password
                                    if(rec.maxWrongPwdCount>0){
                                        // If user has opted for it, then do the wrong password count increment
                                        if(rec.wrongPwdCount+1>=rec.maxWrongPwdCount){
                                            await cb.deleteOne({clipBoardID: clipID})
                                            // Analytics of number of clipboards deleted based on wrong
                                            // password count is collected
                                            await ab.updateOne({param: "clipboardsDeletedBasedOnWrongPasswordCount"},
                                                {$inc: {count: 1}}, {upsert: true})
                                            res.writeHead(400, {'content-type':'text/plain'})
                                            res.end()
                                        }
                                        else{
                                            await cb.updateOne({clipBoardID: clipID},
                                                {$inc: {wrongPwdCount: 1}
                                            })
                                            res.writeHead(400, {'content-type':'text/plain'})
                                            res.end()
                                        }
                                    }
                                    else{
                                        res.writeHead(400, {'content-type':'text/plain'})
                                        res.end()
                                    }
                                }
                            }
                        }
                        else{
                            // If clipBoard ID is not found
                            res.writeHead(404, {'content-type':'text/plain'})
                            res.end()
                        }
                    }
                })
            }
            else{
                res.writeHead(404, {"content-type": 'text/html'})
                fs.createReadStream('./pageNotFound.html').pipe(res)
            }
        }).listen(process.env.PORT, '0.0.0.0', ()=>{
            console.log("Server is listening")
        })
    }
    catch(err){
        console.log("Connection error: "+err)
    }
}

connectDB()