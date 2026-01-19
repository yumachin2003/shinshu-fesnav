FROM python:3.13-slim

WORKDIR /app

RUN pip install pipenv
COPY Pipfile Pipfile.lock ./
RUN pipenv install --system --deploy

COPY . .

EXPOSE 5052

CMD ["gunicorn", "--bind", "0.0.0.0:5052", "app:create_app()"]
