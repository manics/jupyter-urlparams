from tornado import (
    gen,
    web,
)
import traceback

from notebook.base.handlers import IPythonHandler
import json
import os
import jinja2

from .version import __version__


class SyncHandler(IPythonHandler):

    @gen.coroutine
    def emit(self, data):
        if type(data) is not str:
            serialized_data = json.dumps(data)
            if 'output' in data:
                self.log.info(data['output'].rstrip())
        else:
            serialized_data = data
            self.log.info(data)
        self.write('data: {}\n\n'.format(serialized_data))
        yield self.flush()

    @web.authenticated
    @gen.coroutine
    def get(self):
        try:
            paramsfile = self.get_argument('paramsfile')
            params = self.get_argument('params')

            # We gonna send out event streams!
            self.set_header('content-type', 'text/event-stream')
            self.set_header('cache-control', 'no-cache')
            with open(paramsfile, 'w') as f:
                f.write(params)
            self.emit({'phase': 'finished'})
        except Exception as e:
            self.emit({
                'phase': 'error',
                'message': str(e),
                'output': '\n'.join([
                    l.strip()
                    for l in traceback.format_exception(
                        type(e), e, e.__traceback__
                    )
                ])
            })


class UIHandler(IPythonHandler):
    def initialize(self):
        super().initialize()
        # FIXME: Is this really the best way to use jinja2 here?
        # I can't seem to get the jinja2 env in the base handler to
        # actually load templates from arbitrary paths ugh.
        jinja2_env = self.settings['jinja2_env']
        jinja2_env.loader = jinja2.ChoiceLoader([
            jinja2_env.loader,
            jinja2.FileSystemLoader(
                os.path.join(os.path.dirname(__file__), 'templates')
            )
        ])

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

        self.write(
            self.render_template(
                'status.html',
                paramsfile=paramsfile,
                params=params,
                path=path,
                version=__version__,
            ))
        self.flush()
