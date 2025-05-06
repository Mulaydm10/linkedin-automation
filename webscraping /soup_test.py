import requests
from bs4 import BeautifulSoup as bs 

r = requests.get("https://www.linkedin.com/jobs/collections/easy-apply/")
soup=bs(r.content,  'html.parser')

print(soup.prettify())