import sys
try:
    from IndicTransToolkit import IndicProcessor
    print("Loading processor...")
    p = IndicProcessor(inference=True)
    print("Init ok")
    sentences = ["पुलिस ने बिना वारंट गिरफ्तार किया"]
    print("Preprocessing...")
    res = p.preprocess_batch(sentences, src_lang="hin_Deva", tgt_lang="eng_Latn")
    print("Preprocess ok:", res)
except Exception as e:
    print("Caught Exception:", e)
