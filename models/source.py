import datetime
from util import days_ago


# can get the keys using this
    # SELECT
    #   DISTINCT field
    # FROM (
    #   SELECT jsonb_object_keys(post_counts) AS field
    #   FROM person
    #   limit 2000
    # ) AS subquery
    # order by field

sources_metadata = {
    "blogs": {
        "display_name": "Blog posts"
    },
    "f1000": {
        "display_name": "F1000 reviews"
    },
    "facebook": {
        "display_name": "Facebook pages"
    },
    "googleplus": {
        "display_name": "Google+ posts"
    },
    "linkedin": {
        "display_name": "LinkedIn posts"
    },
    # "mendeley": {
    #     "display_name": "Mendeley saves"
    # },
    "news": {
        "display_name": "News mentions"
    },
    "peer_reviews": {
        "display_name": "Public peer reviews"
    },
    "pinterest": {
        "display_name": "Pintrest mentions"
    },
    # we don't get policy documents
    # "policy": {
    #     "display_name": "Policy document mentions"
    # },
    "q&a": {
        "display_name": "Q&A post mentions"
    },
    "reddit": {
        "display_name": "Reddit posts"
    },
    "twitter": {
        "display_name": "Tweets"
    },
    "video": {
        "display_name": "Video mentions"
    },
    "weibo": {
        "display_name": "Weibo posts"
    },
    "wikipedia": {
        "display_name": "Wikipedia articles"
    }
}


class Source(object):

    def __init__(self, source_name, products):
        self.source_name = source_name
        self.products = products
        super(Source, self).__init__()

    @property
    def display_name(self):
        return sources_metadata[self.source_name]["display_name"]

    @property
    def posts_count(self):
        post_counts = 0
        for my_product in self.products:
            if my_product.post_counts and self.source_name in my_product.post_counts:
                post_counts += int(my_product.post_counts[self.source_name])
            elif self.source_name == "mendeley":
                post_counts += my_product.mendeley_readers
        return post_counts

    @property
    def events_last_week_count(self):
        events_last_week_count = 0
        for my_product in self.products:
            if my_product.event_dates and self.source_name in my_product.event_dates:
                date_list = my_product.event_dates[self.source_name]
                events = [days_ago(event_date_string) for event_date_string in date_list]
                events_last_week = [e for e in events if e <= 7]
                events_last_week_count += len(events_last_week)
        return events_last_week_count

    def __repr__(self):
        return u'<Source (source_name)>'.format(
            source_name=self.source_name
        )

    def to_dict(self):
        return {
            "source_name": self.source_name,
            "display_name": self.display_name,
            "posts_count": self.posts_count,
            "events_last_week_count": self.events_last_week_count
        }