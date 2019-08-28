from .version import __version__
from .handlers import (
    SyncHandler,
    UIHandler,
)
from notebook.utils import url_path_join
from tornado.web import StaticFileHandler
import os


def _jupyter_server_extension_paths():
    return [{
        'module': 'jupyterurlparams',
    }]


def load_jupyter_server_extension(nbapp):
    web_app = nbapp.web_app
    base_url = url_path_join(web_app.settings['base_url'], 'urlparams')
    handlers = [
        (url_path_join(base_url, 'api'), SyncHandler),
        (base_url, UIHandler),
        (
            url_path_join(base_url, 'static', '(.*)'),
            StaticFileHandler,
            {'path': os.path.join(os.path.dirname(__file__), 'static')}
        )
    ]
    web_app.settings['nbapp'] = nbapp
    web_app.add_handlers('.*', handlers)
