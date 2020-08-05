# **Use https://github.com/manics/jupyter-notebookparams instead**


## Jupyter URL Params

Create a configuration file for Jupyter notebooks using URL parameters.

For example, this will create a file `config.json` in the default directory containing `{"a":1,"b":false}`, and open that file in the Jupyter editor:

http://localhost:8888/urlparams?paramsfile=config.json&params={"a":1,"b":false}&urlpath=edit/config.json

This mybinder example will create the configuration file and load the example notebook.
When you run the notebook the parameters will be displayed.

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/manics/jupyter-urlparams/master?urlpath=urlparams%3Fparamsfile%3Dconfig.json%26params%3D%7B%22a%22%3A1%2C%22b%22%3Afalse%7D%26urlpath%3Dtree%252Fexample.ipynb)
https://mybinder.org/v2/gh/manics/jupyter-urlparams/master?urlpath=urlparams%3Fparamsfile%3Dconfig.json%26params%3D%7B%22a%22%3A1%2C%22b%22%3Afalse%7D%26urlpath%3Dtree%252Fexample.ipynb


## URL Parameters

**paramsfile**: Path to the parameters file to be written

**params**: A string that will be written to `paramsfile`

**urlpath**: Redirect to this path after writing `paramsfile`


# Installation

    pip install .

Note it doesn't seem to be necessary to enable the extension (`jupyter serverextension enable --py jupyterurlparams --sys-prefix`).
