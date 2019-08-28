from .version import __version__  # noqa
from .handlers import (
    UIHandler,
)
from notebook.utils import url_path_join


def _jupyter_server_extension_paths():
    return [{
        'module': 'jupyterurlparams',
    }]


def load_jupyter_server_extension(nbapp):
    web_app = nbapp.web_app
    base_url = url_path_join(web_app.settings['base_url'], 'urlparams')
    handlers = [
        (base_url, UIHandler),
    ]
    web_app.settings['nbapp'] = nbapp
    web_app.add_handlers('.*', handlers)
