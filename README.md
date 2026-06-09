# Secure-Online-Clipboard

This is a secure online clipboard application. This would be very helpful if we need to transfer the data from one device to another in a secure way and the data should not last permanently.

Front End: HTML, CSS, JS  
Back End: Node.js  
Database Used: MongoDB Atlas  
Deployment: This website is deployed on Railway.  
Deployment URL: https://secure-online-clipboard-production.up.railway.app/  

Project Timeline: May 14, 2026 - May 31, 2026 (for version 1.0.1)  
Further improvements are being done based on users' feedback.
# Features:
1. Each clipboard has a unique 12 - digit ID
2. We can set a password for each clipboard
3. Users can view the password while they are entering it in the password field
4. Users can set the custom TTL based deletion of the clipboard content in the database
5. Users can set the custom read count and custom wrong password count (They also have a choice not to choose this)
6. Passwords are hashed before storing in the database
7. Messages are encrypted before storing in the database
8. Both Server-side and client-side length validation, TTL validation, read count validation and wrong password count validation have been implemented to prevent client-side bypass of imput limits
9. There is a feedback page to tell the feedback to the developer
10. Help Page to understand how to use this website and see the Privacy Policy and Terms of Service of this website
11. Users can copy the generated clipboard ID and the retreived content to the clipboard in the computer
12. Users can download the retreived content as a text file (.txt file)
13. Welcome Page and Page Not Found Page are also present

# Versions:
*Ver 1.0.0*: It is the basic version of the project that contains all the above features. But user has to calculate the TTL in seconds and enter it. Users can enter upto 1000 characters per clipboard.  

*Ver 1.0.1*: This is the second version of this project. The issue of user calculating the time needed and entering it in seconds has been resolved by letting the user to enter the required hours, minutes and seconds and the time in seconds has been calculated from that by the website itself. The character limit per clipboard has been increased from 1000 to 2500.  

*Ver 1.0.2*: This is the third version of this project. The option for viewing the passwords that the user enters in the input field has been enabled. If you press the Show Password button then the text of the button changes from Show Password to See Now and you can see the password that you have typed for 5.5 seconds. During the view time, you can't edit the password that you have entered in the password field. After that the text of the button changes back to Show Password. Then you can edit the password that you have entered in the password field. When the text of the button in the sender section's password field has the text Show Password at that time you can type / edit the password entered in the password field in the sender section. When the text of the button in the sender section's password field is See Now, you can't edit the password that you have entered in the password field in the sender section. Similarly for the receiver section also this feature has been implemented. To improve the security, the limit of the maximum length of password for a clipboard being sent has been increased from 15 characters to 64 characters. Minor UI/UX improvements have been done i.e., Slight animations have been added to the buttons when hovered and when pressed. The copy text button and the copy code when clicked will not show an alert. The text of the button will change to Copied! on clicking and will change back to the original text (copy text and copy code) after 2.5 seconds i.e., 2500 ms. The website interface has been upgraded.  

*Ver 1.0.3*: This is the fourth version of this project. Major security fixes have been done: Server side length validation, Server side TTL validation, Server side read count validation and Server side wrong password count validation have been added with the already existing client-side length validation, client-side TTL validation, client-side read count validation and client-side wrong password count validation to prevent client-side bypass of input limits. TTL Fixes have been done: Giving Minimum TTL of 30 seconds even though the user sets below it so that the clipboard content the user sends can get a meaningful lifecycle.
