# Medicore

#1- python -m venv venv
#2- venv\Scripts\activate
#3- pip install -r requirements.txt
#4- If you encounter bcrypt compatibility errors, install specific versions
pip install "bcrypt==4.0.1" "passlib==1.7.4"
#5- Run the Application - cd medicore-backend - uvicorn main:app --reload --host 0.0.0.0 --port 8000
#6- cd medicore-frontend- npm run dev
