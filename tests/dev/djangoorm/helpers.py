import django


def init_connection():
    django.setup(set_prefix=False)


def get_connection():
    return django


def close_connection():
    pass
