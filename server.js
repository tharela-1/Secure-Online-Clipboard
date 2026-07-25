const http = require('http')
const fs = require('fs')
const querystring = require('querystring')
const crypto = require('crypto')
const mongodb = require('mongodb')
const bcrypt = require('bcrypt')
require('dotenv').config()
const MongoClient = new mongodb.MongoClient(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 7500, connectTimeoutMS: 7500
})

/* Logic to generate the 12 - digit random number:

Formula: Math.floor(Math.random() + (10^12 - 10^11)) + (10^11) 
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
        val = Math.floor(Math.random()*900000000000)+100000000000
        if(rl.includes(val)){ // Check whether value exists there
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

// Get 12 digit random integer
function random12DigitInt(){
  let val = Math.floor(Math.random()*900000000000)+100000000000
  return val
}
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
    return Math.floor(Math.random() * 5 + 0)
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
            5. Number of clipboards deleted based on wrong password count
            6. Number of manual deletions done*/
        const adb = MongoClient.db("Analytics")
        const ab = adb.collection("analytics")
        // setting up the TTL index and the index based on clipboard ID
        await cb.createIndex({expiresAt: 1}, {expireAfterSeconds: 0})
        await cb.createIndex({clipBoardID: 1}, {unique: true})
        http.createServer((req, res)=>{

            // Basic routing to load all the HTML, CSS and the JS pages
            // Using ReadStream to increase the speed of the operations.
            const url = req.url
            const method = req.method

            if(url === '/'){
                res.statusCode = 301 // Redirection to welcome page
                res.setHeader('Location','/welcome')
                res.end()
                return
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
              try{
                let body = ""
                req.on('data',(chunk)=>{
                    body+=chunk
                })
                req.on('end',async()=>{
                  try{
                    const data = querystring.parse(body)
                    // Backend length verification for feedback
                    if(data.feedback.length>1000){
                        res.writeHead(413, {"Content-Type":"text/plain"})
                        res.end()
                        return
                    }
                    else{
                        await fb.insertOne({
                            feedback: data.feedback
                        })
                        res.writeHead(200, {"Content-Type":"text/plain"})
                        res.end()
                        return
                    }  
                  }
                  catch(err){
                    res.writeHead(500,{'content-type':'text/plain'})
                    res.end()
                    return
                  }
                })
              }
              catch(err){
                res.writeHead(500,{'content-type':'text/plain'})
                res.end()
                return
              }
            }
            // Sender Section
            else if(method==='POST' && url==="/sendClipboard"){
              try{
                let body = ""
                req.on('data',(chunk)=>{
                    body+=chunk
                })
                req.on('end', async()=>{
                  try{
                    let data = querystring.parse(body)
                    // Backend length and TTL Verification for sender's side
                    if(data.Content.length>2500 || data.password.length>64){
                        res.writeHead(413, {"Content-Type":"text/plain"})
                        res.end()
                        return
                    }
                    else if(data.Content.length<0 || data.Content.trim().length===0 || data.password.length<=0 || 
                    Number(data.expireSeconds)>86399 ||  Number(data.expireSeconds)<0){
                        res.writeHead(400, {"Content-Type":"text/plain"})
                        res.end()
                        return
                    }
                    else if(Number(data.maxReadCount)>2049 || Number(data.maxReadCount)<0 || 
                        Number(data.maxWrongPwdCount)>100 || Number(data.maxWrongPwdCount)<0 || Number(data.maxUpdateLimit)>2049 ||
                    Number(data.maxUpdateLimit)<0){
                        res.writeHead(400, {"Content-Type":"text/plain"})
                        res.end()
                        return
                    }
                    else if(Number(data.maxUpdateLimit)>Number(data.maxReadCount) && Number(data.maxReadCount)>0){
                        res.writeHead(400, {"Content-Type":"text/plain"})
                        res.end()
                        return
                    }
                    else{
                        let cond = true
                        while(cond){
                            try{
                                let clipID = String(await randomFn())
                                let pwdHashed = String(await pwdHashing(data.password))
                                let rIndex = String(randomIndex())
                                let iv = generateIV()
                                let ivstr = iv.toString('hex')
                                let encryptedObj = msgEncryption(data.Content, rIndex, iv)
                                let encryptedMsg = encryptedObj.message
                                let authTag = encryptedObj.authTag
                                let revokeID = Number(random12DigitInt())
                                let ownerID = Number(random12DigitInt())
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
                                    iv: ivstr,
                                    revokeID: revokeID,
                                    ownerID: ownerID
                                })
                                // Analytics of number of clipboards generated is collected
                                await ab.updateOne({param: "clipboardsGeneratedCount"},{$inc: {count: 1}}, {upsert: true})
                                cond = false
                                res.writeHead(200, {"Content-Type":"text/plain"})
                                res.end(String(clipID)+" "+String(revokeID)+" "+String(ownerID))
                                return
                            }
                            catch(err){
                              if(err.code===11000){
                                console.log("Retrying...")
                              }
                              else{
                                res.writeHead(500, {"Content-Type":"text/plain"})
                                res.end()
                                return
                              }
                            }
                        }
                    }
                  }
                  catch(err){
                    res.writeHead(500, {"Content-Type":"text/plain"})
                    res.end()
                    return
                  }
                })
              }
              catch(err){
                res.writeHead(500, {"Content-Type":"text/plain"})
                res.end()
                return
              }
            }
            // Receiver's section
            else if(method==='POST' && url==='/retreiveClipboard'){
              try{
                let body = ""
                req.on('data',(chunk)=>{
                    body+=chunk
                })
                req.on('end', async()=>{
                  try{
                    let data = querystring.parse(body)
                    let clipID = Number(data.clipID)
                    let clipPass = String(data.clipPass)
                    if(data.clipID.length!=12 || clipPass.length>64){
                        res.writeHead(400,{"Content-Type":"text/plain"})
                        res.end()
                        return
                    }
                    else{
                        const rl = []
                        let clipDoc = await cb.findOne({clipBoardID: clipID})
                        // Check whether the clipboard ID exists or not
                        if(clipDoc){
                            // Check whether the password matches or not
                            if(Date.now()>clipDoc.expiresAt){
                                res.writeHead(410,{"Content-Type":"text/plain"})
                                res.end()
                                return
                            }
                            const matchCheck = await bcrypt.compare(clipPass, clipDoc.password)
                            if(matchCheck===true){
                                try{
                                    // Before doing decryption and sending the message to the receiver
                                    // we need to check the no of read times
                                    // Check readcounter value
                                    // User opted if maxval>0
                                    if(clipDoc.maxReadCount>0){
                                        // Find the cipboard document that has the ID as the clipID and 
                                        // the readcount is less than the max read count
                                        // Using findOneAndUpdate to handle the Race Conditions 
                                        clipDoc = await cb.findOneAndUpdate({clipBoardID: clipID, readCount: {$lt: clipDoc.maxReadCount}},
                                            {$inc: {readCount: 1}}, {returnDocument: "after"}
                                        )
                                        if(!clipDoc || clipDoc.readCount>clipDoc.maxReadCount){
                                            await cb.deleteOne({clipBoardID: clipID})
                                            res.end()
                                            return
                                        }
                                        else if(clipDoc.readCount === clipDoc.maxReadCount){
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
                                            await cb.deleteOne({clipBoardID: clipID})
                                            // Analytics of number of clipboards deleted based on read count is collected
                                            await ab.updateOne({param: "clipboardsDeletedBasedOnReadCount"},
                                                {$inc: {count: 1}}, {upsert: true})
                                            res.end(decryptedMessage)
                                            return
                                        }
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
                                        return
                                    }   
                                }
                                catch(err){
                                    console.log(err)
                                    res.writeHead(500, 'text/plain')
                                    res.end()
                                    return
                                }
                            }
                            else{
                                // It is found that the user has entered the wrong password
                                // Before ending check the no of wrong pwd attempts counter
                                // If maxval>0 then increase wrongcount by 1 
                                //      if exceeds max val then delete the record from the database
                                if(clipDoc.maxWrongPwdCount>0){
                                    // Using findOneAndUpdate to handle the Race Conditions 
                                    clipDoc = await cb.findOneAndUpdate({clipBoardID: clipID, 
                                        wrongPwdCount: {$lt: clipDoc.maxWrongPwdCount}},
                                        {$inc: {wrongPwdCount: 1}}, {returnDocument: "after"}
                                    )
                                    
                                    if(!clipDoc || clipDoc.wrongPwdCount>clipDoc.maxWrongPwdCount){
                                        await cb.deleteOne({clipBoardID: clipID})
                                    }
                                    else if(clipDoc.wrongPwdCount===clipDoc.maxWrongPwdCount){
                                        await cb.deleteOne({clipBoardID: clipID})
                                        // Analytics of number of clipboards deleted based on wrong
                                        // password count is collected
                                        await ab.updateOne({param: "clipboardsDeletedBasedOnWrongPasswordCount"},
                                            {$inc: {count: 1}}, {upsert: true})
                                    }
                                }
                                res.end()
                                return
                            }
                        }
                        else{
                            // If clipBoard ID is not found
                            res.writeHead(404, {'content-type':'text/plain'})
                            res.end()
                            return
                        }
                    }
                  }
                  catch(err){
                    res.writeHead(500, {'content-type':'text/plain'})
                    res.end()
                    return
                  }
                })
              }
              catch(err){
                res.writeHead(500, {'content-type':'text/plain'})
                res.end()
                return

              }
            }
            else if(method==="PATCH" && url==="/updateClipboard"){
              try{  
                let body = ""
                req.on('data',(chunk)=>{
                    body+=chunk
                })
                req.on('end', async()=>{
                  try{
                    let data = querystring.parse(body)
                    let clipID = Number(data.clipID)
                    let clipPass = String(data.clipPass)
                    let updateText = String(data.updateText)
                    if(updateText.trim().length === 0  || updateText.length<=0 ||
                        data.clipID.length!=12 || clipPass.length<=0){
                        res.writeHead(400, {'content-type':'text/plain'})
                        res.end()
                        return
                    }
                    else if(updateText.length>2500 || clipPass.length>64){
                        res.writeHead(413, {'content-type':'text/plain'})
                        res.end()
                        return
                    }
                    else{
                        let rec = await cb.findOne({clipBoardID: clipID})
                        if(rec){
                            if(Date.now()>rec.expiresAt){
                                res.writeHead(410,{"Content-Type":"text/plain"})
                                res.end()
                                return
                            }
                            else if(rec.updateCount>=rec.maxUpdateLimit){
                                // If update limit exceeded or clipboard is read-only
                                res.writeHead(403, {'content-type':'text/plain'})
                                res.end()
                                return
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
                                    // Using findOneAndUpdate() to handle the race conditions
                                    rec = await cb.findOneAndUpdate({clipBoardID: clipID, updateCount: {$lt: rec.maxUpdateLimit}},
                                        {$inc: {updateCount: 1}}, {returnDocument: "after"})
                                    if(!rec || rec.updateCount>rec.maxUpdateLimit){
                                        res.writeHead(400,{"content-type": "text/plain"})
                                        res.end()
                                        return
                                    }
                                    else{
                                        // Do the updation work
                                        await cb.updateOne({clipBoardID: clipID},
                                            { $set: {
                                                keyIndex: rIndex,
                                                authTag: authTag,
                                                message: encryptedMessage,
                                                iv: ivNeeded.toString("hex")
                                            }}
                                        )
                                        // Analytics of number of update count is collected
                                        await ab.updateOne({param: "clipboardsUpdateCount"},
                                            {$inc: {count: 1}}, {upsert: true})
                                        // Send normal end
                                        res.end()
                                        return
                                        }
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
                                            return
                                        }
                                        else{
                                            await cb.updateOne({clipBoardID: clipID},
                                                {$inc: {wrongPwdCount: 1}
                                            })
                                            res.writeHead(400, {'content-type':'text/plain'})
                                            res.end()
                                            return
                                        }
                                    }
                                    else{
                                        res.writeHead(400, {'content-type':'text/plain'})
                                        res.end()
                                        return
                                    }
                                }
                            }
                        }
                        else{
                            // If clipBoard ID is not found
                            res.writeHead(404, {'content-type':'text/plain'})
                            res.end()
                            return
                        }
                    }
                  }
                  catch(err){
                    res.writeHead(500, {'Content-Type':'text/plain'})
                    res.end()
                    return
                  }
                })
              }
              catch(err){
                res.writeHead(500, {'Content-Type':'text/plain'})
                res.end()
                return
              }
            }
            else if(method === 'DELETE' && url==='/instantDelete'){
              try{
                let body = ""
                req.on('data',(chunk)=>{
                  body+=chunk
                }) 
                req.on('end',async()=> {
                  try{
                    let data = querystring.parse(body)
                    let rec = await cb.findOne({clipBoardID: Number(data.clipID)})
                    if(rec){
                      let matchCheck = await bcrypt.compare(data.clipPass, rec.password)
                      if(matchCheck){
                        if(Number(data.revokeID) === rec.revokeID){
                          let doc = await cb.findOneAndDelete({clipBoardID: Number(data.clipID), revokeID: Number(data.revokeID)})
                          if(!doc){
                            res.writeHead(400, {'Content-Type': 'text/plain'})
                            res.end()
                            return
                          }
                          else{
                            await ab.updateOne({param: "clipBoardDeletedBasedOnManualDeletion"},{$inc: {count: 1}}, {upsert: true})
                            res.writeHead(200, {'Content-Type': 'text/plain'})
                            res.end()
                            return
                          }
                        }
                        else{
                          res.writeHead(400, {'Content-Type': 'text/plain'})
                          res.end()
                          return
                        }
                      }
                      else{
                        res.writeHead(400, {'Content-Type': 'text/plain'})
                        res.end()
                        return
                      }
                    }
                    else{
                      
                      res.writeHead(404, {'Content-Type': 'text/plain'})
                      res.end()
                      return
                    }
                  }
                  catch(err){
                    res.writeHead(500,{'Content-Type':'text/plain'})
                    res.end()
                    return
                  }
                })
              }
              catch(err){
                res.writeHead(500, {'content-type':'text/plain'})
                res.end()
                return
              }
            }
            else if(method === "POST" && url === "/getOwnerDetails"){
              try{
                let body = ""
                req.on("data", (chunk)=>{
                  body+=chunk
                })
                req.on("end", async()=>{
                  try{
                    let data = querystring.parse(body)
                    let clipID = data.clipID
                    let clipPass = data.clipPass
                    let ownerID = data.ownerID
                    if(!clipID || !clipPass || !ownerID || clipID.length!=12 || ownerID.length!=12){
                      res.writeHead(400, {'content-type':'text/plain'})
                      res.end()
                      return
                    }
                    else if(clipPass.length<=0 || clipPass.length>64){
                      res.writeHead(400, {'content-type':'text/plain'})
                      res.end()
                      return
                    }
                    else{
                      // Check whether the document exists with the clipboard id
                      let rec = await cb.findOne({clipBoardID: Number(clipID)})
                      if(rec){
                        if(Date.now()>rec.expiresAt){
                          // Record is there but TTL has been expired
                          res.writeHead(410,{"Content-Type":"text/plain"})
                          res.end()
                          return
                        }
                        if(Number(ownerID) === rec.ownerID){
                          // owner ID matched
                          let matchCheck = await bcrypt.compare(clipPass, rec.password)
                          if(matchCheck){
                            // Password is correct so we can proceed with the decryption of message
                            const keyList = [process.env.AES_KEY_1, process.env.AES_KEY_2,
                                                process.env.AES_KEY_3, process.env.AES_KEY_4, 
                                                process.env.AES_KEY_5]
                            let keyChosen = Buffer.from(keyList[rec.keyIndex], 'hex')
                            let authTagGot = Buffer.from(rec.authTag, 'hex')
                            let ivNeeded = Buffer.from(rec.iv,'hex')
                            let encryptedMessage = rec.message

                            const decipherObj = crypto.createDecipheriv('aes-256-gcm',keyChosen,ivNeeded)
                            decipherObj.setAuthTag(authTagGot)
                            let decryptedMessage = decipherObj.update(encryptedMessage,'hex','utf8')
                            decryptedMessage+=decipherObj.final('utf8')

                            // Now we have got the decrypted message
                            // Let's make the needed JSON format and send it to the frontend JS

                            let neededJSON = {
                              clipBoardID: rec.clipBoardID,
                              message: decryptedMessage,
                              expireSeconds: rec.expireSeconds,
                              expiresAt: rec.expiresAt,
                              readCount: rec.readCount,
                              maxReadCount: rec.maxReadCount,
                              wrongPwdCount: rec.wrongPwdCount,
                              maxWrongPwdCount: rec.maxWrongPwdCount,
                              updateCount: rec.updateCount,
                              maxUpdateLimit: rec.maxUpdateLimit,
                              revokeID: rec.revokeID,
                              ownerID: rec.ownerID
                            }
                            res.writeHead(200, {'content-type':'application/json'})
                            res.end(JSON.stringify(neededJSON))
                            return
                          }
                          else{
                            // Password Mismatched
                            if(rec.maxWrongPwdCount>0){
                              // The owner has said to allow only specific number of wrong password attempts not unlimited
                              // Use of atomic operations to handle the race conditions
                              rec = await cb.findOneAndUpdate({clipBoardID: Number(clipID), 
                                        wrongPwdCount: {$lt: rec.maxWrongPwdCount}},
                                        {$inc: {wrongPwdCount: 1}}, {returnDocument: "after"})
                              if(!rec){
                                cb.deleteOne({clipBoardID: Number(clipID)})
                              }
                              else if(rec.wrongPwdCount === rec.maxWrongPwdCount){
                                await cb.deleteOne({clipBoardID: clipID})
                                await ab.updateOne({param: "clipboardsDeletedBasedOnWrongPasswordCount"},
                                            {$inc: {count: 1}}, {upsert: true})
                              }
                            }
                            res.writeHead(400, {'content-type':'text/plain'})
                            res.end()
                            return
                          }
                        }
                        else{
                          // owner ID mismatched
                          res.writeHead(400, {'content-type':'text/plain'})
                          res.end()
                          return
                        }
                      }
                      else{
                        // Record not found
                        res.writeHead(404, {'content-type':'text/plain'})
                        res.end()
                        return
                      }
                    }
                  }
                  catch(err){
                    res.writeHead(500, {'content-type':'text/plain'})
                    res.end()
                    return
                  }
                })
              }
              catch(err){
                res.writeHead(500, {'content-type':'text/plain'})
                res.end()
                return
              }
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