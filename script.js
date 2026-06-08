async function copyURL(){
    try{
        let val = document.getElementById("urlOutput").value
        let btn = document.getElementById("copyURLBtn")
        await navigator.clipboard.writeText(val)
        btn.textContent = "Copied!"
        setTimeout(()=>{
            btn.textContent = "Copy URL"
        },2500)
    }
    catch(err){
        console.log("Failed to copy: "+err)
    }
}

async function sendFeedback(event){
    event.preventDefault();
    let feedback = document.getElementById("feedbackInput")
    let val = feedback.value
    
    let response = await fetch("/sendFeedback",{
        method: "POST",
        headers: {
            'Content-Type':'application/x-www-form-urlencoded'
        },
        body: `feedback=${encodeURIComponent(val)}`
    })
    if(response.ok){
        alert("Feedback sent successfully! Thank you for your valuable feedback!!")
    }
    else{
        alert("Feedback not sent.")
    }
}