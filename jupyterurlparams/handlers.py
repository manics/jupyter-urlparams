from tornado import (
    gen,
    web,
)

from notebook.base.handlers import IPythonHandler
import os


class UIHandler(IPythonHandler):
    @web.authenticated
    @gen.coroutine
    def get(self):
        app_env = os.getenv('URLPARAMS_APP', default='notebook')

        paramsfile = self.get_argument('paramsfile')
        params = self.get_argument('params')
        urlPath = (self.get_argument('urlpath', None) or
                   self.get_argument('urlPath', None))
        app = self.get_argument('app', app_env)

        if urlPath:
            path = urlPath
        elif app.lower() == 'lab':
            path = 'lab/tree'
        else:
            path = 'tree'

        with open(paramsfile, 'w') as f:
            f.write(params)
        self.redirect(path)
