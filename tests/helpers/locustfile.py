# coding: utf8

from locust import User, task, events

class TestUser(User):
    @task(20)
    def hello(self):
        pass
